import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Download,
  FastForward,
  Layers,
  Moon,
  MousePointer2,
  Pause,
  Play,
  Plus,
  Rewind,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";

type PivotMode = "top-left" | "bottom-left" | "center";
type EditorMode = "select" | "add";
type ViewMode = "frame" | "atlas";
type ThemeMode = "dark" | "light";

type FramePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type FrameData = {
  id: string;
  name: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  points: FramePoint[];
};

type AtlasLayout = {
  rows: number;
  columns: number;
  padding: number;
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  positions: { x: number; y: number; w: number; h: number }[];
};

type StageTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  frameWidth: number;
  frameHeight: number;
  viewWidth: number;
  viewHeight: number;
};

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
const MIN_FRAME_ZOOM = 0.5;
const MAX_FRAME_ZOOM = 8;
const ZOOM_STEP = 1.1;

const PIVOT_OPTIONS: PivotMode[] = ["top-left", "bottom-left", "center"];

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pt-${Math.random().toString(36).slice(2, 10)}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const drawCheckerboard = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  size = 18,
  colorA = "rgba(255, 255, 255, 0.65)",
  colorB = "rgba(233, 233, 233, 0.7)"
) => {
  ctx.save();
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? colorA : colorB;
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.restore();
};

const toHslColor = (raw: string, fallback: string, alpha?: number) => {
  const value = raw.trim();
  if (!value) {
    return fallback;
  }
  if (typeof alpha === "number") {
    return `hsl(${value} / ${alpha})`;
  }
  return `hsl(${value})`;
};

const computeAtlasLayout = (
  frames: FrameData[],
  rows: number,
  padding: number
): AtlasLayout => {
  const safePadding = Math.max(0, Math.round(padding));
  const safeRows = Math.max(1, Math.round(rows) || 1);
  const cellWidth = Math.max(1, ...frames.map((frame) => frame.width));
  const cellHeight = Math.max(1, ...frames.map((frame) => frame.height));
  const columns = Math.max(1, Math.ceil(frames.length / safeRows));
  const width = columns * cellWidth + safePadding * (columns + 1);
  const height = safeRows * cellHeight + safePadding * (safeRows + 1);
  const positions = frames.map((_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      x: safePadding + column * (cellWidth + safePadding),
      y: safePadding + row * (cellHeight + safePadding),
      w: cellWidth,
      h: cellHeight,
    };
  });

  return {
    rows: safeRows,
    columns,
    padding: safePadding,
    cellWidth,
    cellHeight,
    width,
    height,
    positions,
  };
};

const toPivotCoords = (
  point: { x: number; y: number },
  frame: { width: number; height: number },
  mode: PivotMode
) => {
  if (mode === "center") {
    return {
      x: point.x - frame.width / 2,
      y: point.y - frame.height / 2,
    };
  }
  if (mode === "bottom-left") {
    return {
      x: point.x,
      y: frame.height - point.y,
    };
  }
  return { x: point.x, y: point.y };
};

const fromPivotCoords = (
  point: { x: number; y: number },
  frame: { width: number; height: number },
  mode: PivotMode
) => {
  if (mode === "center") {
    return {
      x: point.x + frame.width / 2,
      y: point.y + frame.height / 2,
    };
  }
  if (mode === "bottom-left") {
    return {
      x: point.x,
      y: frame.height - point.y,
    };
  }
  return { x: point.x, y: point.y };
};

const parsePivotMode = (value: unknown): PivotMode => {
  if (value === "top-left" || value === "bottom-left" || value === "center") {
    return value;
  }
  return "top-left";
};

const loadFrameFromFile = (file: File): Promise<FrameData> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const frame: FrameData = {
        id: createId(),
        name: file.name,
        image: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        points: [],
      };
      URL.revokeObjectURL(url);
      resolve(frame);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };
    img.src = url;
  });

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const DEFAULT_ROWS = 4;
const DEFAULT_PADDING = 6;
const DEFAULT_FPS = 12;

function App() {
  const { t } = useI18n();
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("select");
  const [pivotMode, setPivotMode] = useState<PivotMode>("top-left");
  const [viewMode, setViewMode] = useState<ViewMode>("frame");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem("sg-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [padding, setPadding] = useState(DEFAULT_PADDING);
  const [showGrid, setShowGrid] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [frameZoom, setFrameZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [speed, setSpeed] = useState(1);
  const [reverse, setReverse] = useState(false);
  const [loop, setLoop] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<StageTransform | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const currentFrame = frames[currentFrameIndex];
  const currentPoints = currentFrame?.points ?? [];
  const selectedPoint =
    currentPoints.find((point) => point.id === selectedPointId) ?? null;
  const pivotLabels: Record<PivotMode, string> = {
    "top-left": t("pivot.topLeft"),
    "bottom-left": t("pivot.bottomLeft"),
    center: t("pivot.center"),
  };

  const atlasLayout = useMemo(
    () => computeAtlasLayout(frames, rows, padding),
    [frames, rows, padding]
  );

  const sizeMismatch = useMemo(() => {
    if (frames.length < 2) {
      return false;
    }
    const base = frames[0];
    return frames.some(
      (frame) => frame.width !== base.width || frame.height !== base.height
    );
  }, [frames]);

  const handleCanvasWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!currentFrame || viewMode !== "frame") {
      return;
    }
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const viewWidth = stageSize.width || rect.width;
    const viewHeight = stageSize.height || rect.height;
    const margin = 32;
    const safeWidth = Math.max(1, viewWidth - margin * 2);
    const safeHeight = Math.max(1, viewHeight - margin * 2);
    const baseScale = Math.min(
      safeWidth / currentFrame.width,
      safeHeight / currentFrame.height
    );
    const currentScale = baseScale * frameZoom;
    const offsetX =
      (viewWidth - currentFrame.width * currentScale) / 2 + panOffset.x;
    const offsetY =
      (viewHeight - currentFrame.height * currentScale) / 2 + panOffset.y;
    const frameX = (pointerX - offsetX) / currentScale;
    const frameY = (pointerY - offsetY) / currentScale;

    const zoomFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const nextZoom = clamp(
      frameZoom * zoomFactor,
      MIN_FRAME_ZOOM,
      MAX_FRAME_ZOOM
    );
    if (Math.abs(nextZoom - frameZoom) < 0.0001) {
      return;
    }

    const nextScale = baseScale * nextZoom;
    const nextOffsetX = pointerX - frameX * nextScale;
    const nextOffsetY = pointerY - frameY * nextScale;
    const nextCenterX = (viewWidth - currentFrame.width * nextScale) / 2;
    const nextCenterY = (viewHeight - currentFrame.height * nextScale) / 2;

    setFrameZoom(nextZoom);
    setPanOffset({
      x: nextOffsetX - nextCenterX,
      y: nextOffsetY - nextCenterY,
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("sg-theme", theme);
  }, [theme]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(stageSize.width * dpr));
    canvas.height = Math.max(1, Math.floor(stageSize.height * dpr));
    canvas.style.width = `${stageSize.width}px`;
    canvas.style.height = `${stageSize.height}px`;
  }, [stageSize]);

  useEffect(() => {
    if (frames.length === 0) {
      setCurrentFrameIndex(0);
      setSelectedPointId(null);
      setIsPlaying(false);
      return;
    }
    if (currentFrameIndex > frames.length - 1) {
      setCurrentFrameIndex(frames.length - 1);
    }
  }, [frames.length, currentFrameIndex]);

  useEffect(() => {
    if (!currentFrame) {
      setSelectedPointId(null);
      return;
    }
    if (
      selectedPointId &&
      !currentFrame.points.some((point) => point.id === selectedPointId)
    ) {
      setSelectedPointId(null);
    }
  }, [currentFrame, selectedPointId]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      return;
    }
    const safeFps = Math.max(1, fps);
    const intervalMs = 1000 / (safeFps * speed);
    const timer = window.setInterval(() => {
      setCurrentFrameIndex((prev) => {
        let next = reverse ? prev - 1 : prev + 1;
        if (next < 0 || next >= frames.length) {
          if (loop) {
            next = reverse ? frames.length - 1 : 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, frames.length, fps, speed, reverse, loop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stageSize.width === 0 || stageSize.height === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const viewWidth = canvas.width / dpr;
    const viewHeight = canvas.height / dpr;
    const styles = window.getComputedStyle(document.documentElement);
    const accentColor = toHslColor(
      styles.getPropertyValue("--accent"),
      "hsl(197 52% 48%)"
    );
    const accentStrong = toHslColor(
      styles.getPropertyValue("--accent"),
      "rgba(44, 155, 167, 0.8)",
      0.85
    );
    const foregroundColor = toHslColor(
      styles.getPropertyValue("--foreground"),
      "hsl(224 35% 18%)"
    );
    const mutedColor = toHslColor(
      styles.getPropertyValue("--muted-foreground"),
      "rgba(28, 32, 40, 0.8)",
      0.8
    );
    const borderColor = toHslColor(
      styles.getPropertyValue("--border"),
      "rgba(20, 20, 20, 0.12)",
      0.4
    );
    const checkerBase = toHslColor(
      styles.getPropertyValue("--background"),
      "rgba(255, 255, 255, 0.6)"
    );
    const checkerAlt = toHslColor(
      styles.getPropertyValue("--card"),
      "rgba(233, 233, 233, 0.7)"
    );
    const gridColor = toHslColor(
      styles.getPropertyValue("--border"),
      "rgba(20, 20, 20, 0.08)",
      0.2
    );
    const frameOutline = toHslColor(
      styles.getPropertyValue("--border"),
      "rgba(18, 24, 33, 0.2)",
      0.5
    );
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    drawCheckerboard(ctx, viewWidth, viewHeight, 18, checkerBase, checkerAlt);

    if (viewMode === "frame" && currentFrame) {
      const margin = 32;
      const safeWidth = Math.max(1, viewWidth - margin * 2);
      const safeHeight = Math.max(1, viewHeight - margin * 2);
      const baseScale = Math.min(
        safeWidth / currentFrame.width,
        safeHeight / currentFrame.height
      );
      const scale = baseScale * frameZoom;
      const drawWidth = currentFrame.width * scale;
      const drawHeight = currentFrame.height * scale;
      const offsetX = (viewWidth - drawWidth) / 2 + panOffset.x;
      const offsetY = (viewHeight - drawHeight) / 2 + panOffset.y;

      transformRef.current = {
        scale,
        offsetX,
        offsetY,
        frameWidth: currentFrame.width,
        frameHeight: currentFrame.height,
        viewWidth,
        viewHeight,
      };

      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.shadowColor = "rgba(20, 24, 28, 0.2)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(
        currentFrame.image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      ctx.strokeStyle = frameOutline;
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);

      if (showGrid) {
        const gridStep = scale >= 10 ? 1 : scale >= 6 ? 2 : scale >= 3 ? 4 : 0;
        if (gridStep > 0) {
          ctx.strokeStyle = gridColor;
          ctx.lineWidth = 1;
          for (let x = 0; x <= currentFrame.width; x += gridStep) {
            const px = offsetX + x * scale;
            ctx.beginPath();
            ctx.moveTo(px, offsetY);
            ctx.lineTo(px, offsetY + drawHeight);
            ctx.stroke();
          }
          for (let y = 0; y <= currentFrame.height; y += gridStep) {
            const py = offsetY + y * scale;
            ctx.beginPath();
            ctx.moveTo(offsetX, py);
            ctx.lineTo(offsetX + drawWidth, py);
            ctx.stroke();
          }
        }
      }

      const pivotPoint =
        pivotMode === "center"
          ? { x: currentFrame.width / 2, y: currentFrame.height / 2 }
          : pivotMode === "bottom-left"
            ? { x: 0, y: currentFrame.height }
            : { x: 0, y: 0 };
      const pivotX = offsetX + pivotPoint.x * scale;
      const pivotY = offsetY + pivotPoint.y * scale;
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = accentStrong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX - 14, pivotY);
      ctx.lineTo(pivotX + 14, pivotY);
      ctx.moveTo(pivotX, pivotY - 14);
      ctx.lineTo(pivotX, pivotY + 14);
      ctx.stroke();
      ctx.restore();

      if (showPoints) {
        currentPoints.forEach((point) => {
          const px = offsetX + point.x * scale;
          const py = offsetY + point.y * scale;
          const isSelected = point.id === selectedPointId;
          ctx.beginPath();
          ctx.fillStyle = isSelected ? accentColor : foregroundColor;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = isSelected ? 2 : 1.5;
          ctx.arc(px, py, isSelected ? 6 : 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = "12px 'Space Grotesk'";
          ctx.fillStyle = mutedColor;
          ctx.fillText(point.name, px + 10, py - 10);
        });
      }
    } else if (viewMode === "atlas" && frames.length > 0) {
      transformRef.current = null;
      const margin = 24;
      const scale = Math.min(
        (viewWidth - margin * 2) / atlasLayout.width,
        (viewHeight - margin * 2) / atlasLayout.height
      );
      const drawWidth = atlasLayout.width * scale;
      const drawHeight = atlasLayout.height * scale;
      const offsetX = (viewWidth - drawWidth) / 2;
      const offsetY = (viewHeight - drawHeight) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = false;

      atlasLayout.positions.forEach((cell, index) => {
        const frame = frames[index];
        if (!frame) {
          return;
        }
        const offsetCellX = Math.floor(
          (atlasLayout.cellWidth - frame.width) / 2
        );
        const offsetCellY = Math.floor(
          (atlasLayout.cellHeight - frame.height) / 2
        );
        ctx.drawImage(
          frame.image,
          cell.x + offsetCellX,
          cell.y + offsetCellY,
          frame.width,
          frame.height
        );
      });

      ctx.restore();

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1 / scale;
      atlasLayout.positions.forEach((cell, index) => {
        ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
        if (index === currentFrameIndex) {
          ctx.save();
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2 / scale;
          ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
          ctx.restore();
        }
      });
      ctx.restore();
    } else {
      transformRef.current = null;
    }
  }, [
    atlasLayout,
    currentFrame,
    currentFrameIndex,
    currentPoints,
    frames,
    frameZoom,
    panOffset,
    pivotMode,
    selectedPointId,
    showGrid,
    showPoints,
    stageSize,
    theme,
    viewMode,
  ]);

  const updateCurrentFramePoints = (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => {
    if (!currentFrame) {
      return;
    }
    setFrames((prev) =>
      prev.map((frame, index) =>
        index === currentFrameIndex
          ? { ...frame, points: updater(frame.points) }
          : frame
      )
    );
  };

  const updateAllFramesPoints = (
    updater: (points: FramePoint[], frame: FrameData) => FramePoint[]
  ) => {
    setFrames((prev) =>
      prev.map((frame) => ({ ...frame, points: updater(frame.points, frame) }))
    );
  };

  const addPointAt = (x: number, y: number) => {
    if (!currentFrame || frames.length === 0) {
      return;
    }
    const pointId = createId();
    const nextIndex =
      frames.reduce((max, frame) => Math.max(max, frame.points.length), 0) + 1;
    const name = t("point.defaultName", { index: nextIndex });
    const ratioX = currentFrame.width ? x / currentFrame.width : 0;
    const ratioY = currentFrame.height ? y / currentFrame.height : 0;

    updateAllFramesPoints((points, frame) => {
      const frameX = clamp(Math.round(frame.width * ratioX), 0, frame.width);
      const frameY = clamp(Math.round(frame.height * ratioY), 0, frame.height);
      const point: FramePoint = {
        id: pointId,
        name,
        x: frameX,
        y: frameY,
      };
      return [...points, point];
    });
    setSelectedPointId(pointId);
  };

  const handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!currentFrame || viewMode !== "frame") {
      return;
    }
    const canvas = canvasRef.current;
    const transform = transformRef.current;
    if (!canvas || !transform) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    const frameX = (rawX - transform.offsetX) / transform.scale;
    const frameY = (rawY - transform.offsetY) / transform.scale;
    if (
      frameX < 0 ||
      frameY < 0 ||
      frameX > currentFrame.width ||
      frameY > currentFrame.height
    ) {
      return;
    }

    const clampedX = clamp(Math.round(frameX), 0, currentFrame.width);
    const clampedY = clamp(Math.round(frameY), 0, currentFrame.height);

    if (editorMode === "add") {
      addPointAt(clampedX, clampedY);
      return;
    }

    const hitRadius = Math.max(4, 10 / transform.scale);
    const hit = currentPoints.find(
      (point) =>
        Math.hypot(point.x - clampedX, point.y - clampedY) <= hitRadius
    );
    if (hit) {
      setSelectedPointId(hit.id);
      setDraggingPointId(hit.id);
      canvas.setPointerCapture(event.pointerId);
    } else {
      setSelectedPointId(null);
    }
  };

  const handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!currentFrame || !draggingPointId || viewMode !== "frame") {
      return;
    }
    const canvas = canvasRef.current;
    const transform = transformRef.current;
    if (!canvas || !transform) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    const frameX = (rawX - transform.offsetX) / transform.scale;
    const frameY = (rawY - transform.offsetY) / transform.scale;
    const clampedX = clamp(Math.round(frameX), 0, currentFrame.width);
    const clampedY = clamp(Math.round(frameY), 0, currentFrame.height);
    updateCurrentFramePoints((points) =>
      points.map((point) =>
        point.id === draggingPointId
          ? { ...point, x: clampedX, y: clampedY }
          : point
      )
    );
  };

  const handleCanvasPointerUp = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (draggingPointId) {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    }
    setDraggingPointId(null);
  };

  const handleFramesImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const pngFiles = Array.from(files).filter(
      (file) =>
        file.type === "image/png" ||
        file.name.toLowerCase().endsWith(".png")
    );
    if (pngFiles.length === 0) {
      return;
    }
    try {
      const loaded = await Promise.all(
        pngFiles.map((file) => loadFrameFromFile(file))
      );
      setFrames(loaded);
      setCurrentFrameIndex(0);
      setSelectedPointId(null);
      setIsPlaying(false);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };

  const handleJsonImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const pivotFrom = parsePivotMode(
        parsed?.meta?.pivot ?? parsed?.meta?.pivotMode
      );
      if (!Array.isArray(parsed?.frames)) {
        return;
      }
      const nameToId = new Map<string, string>();
      setFrames((prev) =>
        prev.map((frame) => {
          const match = parsed.frames.find(
            (entry: { name?: string; filename?: string; id?: string }) =>
              entry?.name === frame.name ||
              entry?.filename === frame.name ||
              entry?.id === frame.id
          );
          if (!match || !Array.isArray(match.points)) {
            return frame;
          }
          const nextPoints = match.points.map(
            (point: { name?: string; x?: number; y?: number }, index: number) => {
              const name =
                typeof point.name === "string" && point.name.length > 0
                  ? point.name
                  : t("point.defaultName", { index: index + 1 });
              const id = nameToId.get(name) ?? createId();
              nameToId.set(name, id);
              const pivotPoint = {
                x: Number(point.x ?? 0),
                y: Number(point.y ?? 0),
              };
              const framePoint = fromPivotCoords(pivotPoint, frame, pivotFrom);
              return {
                id,
                name,
                x: clamp(Math.round(framePoint.x), 0, frame.width),
                y: clamp(Math.round(framePoint.y), 0, frame.height),
              };
            }
          );
          return { ...frame, points: nextPoints };
        })
      );
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };

  const handleExportPng = () => {
    if (frames.length === 0) {
      return;
    }
    const layout = computeAtlasLayout(frames, rows, padding);
    const canvas = document.createElement("canvas");
    canvas.width = layout.width;
    canvas.height = layout.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    layout.positions.forEach((cell, index) => {
      const frame = frames[index];
      if (!frame) {
        return;
      }
      const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
      const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
      ctx.drawImage(
        frame.image,
        cell.x + offsetX,
        cell.y + offsetY,
        frame.width,
        frame.height
      );
    });
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, "sprite-atlas.png");
      }
    });
  };

  const handleExportJson = () => {
    if (frames.length === 0) {
      return;
    }
    const layout = computeAtlasLayout(frames, rows, padding);
    const exportedFrames = frames.map((frame, index) => {
      const cell = layout.positions[index];
      const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
      const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
      return {
        name: frame.name,
        x: cell.x + offsetX,
        y: cell.y + offsetY,
        w: frame.width,
        h: frame.height,
        points: frame.points.map((point) => {
          const pivotPoint = toPivotCoords(point, frame, pivotMode);
          return {
            name: point.name,
            x: Math.round(pivotPoint.x),
            y: Math.round(pivotPoint.y),
          };
        }),
      };
    });

    const payload = {
      meta: {
        app: "SheetGenerator",
        image: "sprite-atlas.png",
        size: { w: layout.width, h: layout.height },
        rows: layout.rows,
        columns: layout.columns,
        padding: layout.padding,
        pivot: pivotMode,
      },
      frames: exportedFrames,
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
      "sprite-atlas.json"
    );
  };

  const selectedPivotCoords = selectedPoint && currentFrame
    ? toPivotCoords(selectedPoint, currentFrame, pivotMode)
    : null;
  const selectedPivotX = selectedPivotCoords
    ? Math.round(selectedPivotCoords.x)
    : 0;
  const selectedPivotY = selectedPivotCoords
    ? Math.round(selectedPivotCoords.y)
    : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full divide-y divide-border/60 p-0 lg:grid lg:h-screen lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0 lg:gap-0">
        <aside className="space-y-4 rounded-none border-0 bg-card/80 p-4 shadow-none backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("label.tools")}
              </p>
              <h2 className="text-lg font-semibold">{t("panel.tools")}</h2>
            </div>
            <Badge variant="secondary">
              {frames.length ? `${currentFrameIndex + 1}/${frames.length}` : "0"}
            </Badge>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("label.mode")}
              </Label>
              <Badge variant="outline" className="font-mono text-xs">
                {editorMode === "add" ? t("mode.add") : t("mode.select")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={editorMode === "select" ? "default" : "secondary"}
                size="sm"
                onClick={() => setEditorMode("select")}
              >
                <MousePointer2 className="mr-2 h-4 w-4" />
                {t("action.select")}
              </Button>
              <Button
                variant={editorMode === "add" ? "default" : "secondary"}
                size="sm"
                onClick={() => setEditorMode("add")}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("action.addPoint")}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (!currentFrame) {
                  return;
                }
                addPointAt(currentFrame.width / 2, currentFrame.height / 2);
              }}
              disabled={!currentFrame}
            >
              <Crosshair className="mr-2 h-4 w-4" />
              {t("action.centerPoint")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t("label.pivotSpace")}</Label>
            <Select
              value={pivotMode}
              onValueChange={(value) => setPivotMode(value as PivotMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholder.pivotMode")} />
              </SelectTrigger>
              <SelectContent>
                {PIVOT_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {pivotLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("hint.pivotExport")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("label.points")}</Label>
              <Badge variant="outline">{currentPoints.length}</Badge>
            </div>
            <ScrollArea className="h-52 rounded-2xl border border-border/50 bg-background/70">
              <div className="space-y-2 p-3">
                {currentPoints.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    {t("hint.noPoints")}
                  </div>
                ) : (
                  currentPoints.map((point) => {
                    const pivotCoords =
                      currentFrame && toPivotCoords(point, currentFrame, pivotMode);
                    const displayX = pivotCoords ? Math.round(pivotCoords.x) : 0;
                    const displayY = pivotCoords ? Math.round(pivotCoords.y) : 0;
                    return (
                      <button
                        key={point.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                          point.id === selectedPointId
                            ? "border-accent/40 bg-accent/10"
                            : "border-border/60 bg-muted/30 hover:bg-muted/60"
                        )}
                        onClick={() => setSelectedPointId(point.id)}
                      >
                        <div>
                          <div className="text-sm font-medium">{point.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {pivotLabels[pivotMode]}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {displayX},{displayY}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
            <div className="flex items-center justify-between">
              <Label>{t("label.selectedPoint")}</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!selectedPoint) {
                    return;
                  }
                  updateAllFramesPoints((points) =>
                    points.filter((point) => point.id !== selectedPoint.id)
                  );
                  setSelectedPointId(null);
                }}
                disabled={!selectedPoint}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="point-name">{t("label.name")}</Label>
              <Input
                id="point-name"
                value={selectedPoint?.name ?? ""}
                onChange={(event) => {
                  if (!selectedPoint) {
                    return;
                  }
                  const name = event.target.value;
                  updateAllFramesPoints((points) =>
                    points.map((point) =>
                      point.id === selectedPoint.id ? { ...point, name } : point
                    )
                  );
                }}
                placeholder={t("placeholder.pointName")}
                disabled={!selectedPoint}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="point-x">{t("label.x")}</Label>
                <Input
                  id="point-x"
                  type="number"
                  value={selectedPoint ? String(selectedPivotX) : ""}
                  onChange={(event) => {
                    if (!selectedPoint || !currentFrame) {
                      return;
                    }
                    const nextX = toNumber(event.target.value, selectedPivotX);
                    const nextPivot = { x: nextX, y: selectedPivotY };
                    const nextFramePoint = fromPivotCoords(
                      nextPivot,
                      currentFrame,
                      pivotMode
                    );
                    updateCurrentFramePoints((points) =>
                      points.map((point) =>
                        point.id === selectedPoint.id
                          ? {
                              ...point,
                              x: clamp(
                                Math.round(nextFramePoint.x),
                                0,
                                currentFrame.width
                              ),
                              y: clamp(
                                Math.round(nextFramePoint.y),
                                0,
                                currentFrame.height
                              ),
                            }
                          : point
                      )
                    );
                  }}
                  disabled={!selectedPoint}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="point-y">{t("label.y")}</Label>
                <Input
                  id="point-y"
                  type="number"
                  value={selectedPoint ? String(selectedPivotY) : ""}
                  onChange={(event) => {
                    if (!selectedPoint || !currentFrame) {
                      return;
                    }
                    const nextY = toNumber(event.target.value, selectedPivotY);
                    const nextPivot = { x: selectedPivotX, y: nextY };
                    const nextFramePoint = fromPivotCoords(
                      nextPivot,
                      currentFrame,
                      pivotMode
                    );
                    updateCurrentFramePoints((points) =>
                      points.map((point) =>
                        point.id === selectedPoint.id
                          ? {
                              ...point,
                              x: clamp(
                                Math.round(nextFramePoint.x),
                                0,
                                currentFrame.width
                              ),
                              y: clamp(
                                Math.round(nextFramePoint.y),
                                0,
                                currentFrame.height
                              ),
                            }
                          : point
                      )
                    );
                  }}
                  disabled={!selectedPoint}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex h-full flex-col gap-4 bg-card/70 p-4">
          <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  {t("app.kicker")}
                </div>
                <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("app.subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {currentFrame
                    ? t("status.frameSize", {
                        w: currentFrame.width,
                        h: currentFrame.height,
                      })
                    : t("status.noFrame")}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {t("status.atlasSize", {
                    w: atlasLayout.width,
                    h: atlasLayout.height,
                  })}
                </Badge>
                <Badge variant="secondary">
                  {t("status.rows", { rows: atlasLayout.rows })}
                </Badge>
                <Badge variant="secondary">
                  {t("status.columns", { columns: atlasLayout.columns })}
                </Badge>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Select
                    value={theme}
                    onValueChange={(value) => setTheme(value as ThemeMode)}
                  >
                    <SelectTrigger
                      className="h-8 w-[110px] border-0 bg-transparent px-0 text-xs"
                      aria-label={t("label.theme")}
                    >
                      <SelectValue placeholder={t("label.theme")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t("theme.dark")}</SelectItem>
                      <SelectItem value="light">{t("theme.light")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as ViewMode)}
              >
                <TabsList>
                  <TabsTrigger value="frame">{t("tab.frame")}</TabsTrigger>
                  <TabsTrigger value="atlas">{t("tab.atlas")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="grid-toggle"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                  <Label htmlFor="grid-toggle">{t("label.grid")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="points-toggle"
                    checked={showPoints}
                    onCheckedChange={setShowPoints}
                  />
                  <Label htmlFor="points-toggle">{t("label.pointsToggle")}</Label>
                </div>
              </div>
            </div>

            <div
              ref={stageRef}
              className="relative mt-4 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-background/70"
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "h-full w-full touch-none",
                  editorMode === "add" ? "cursor-crosshair" : "cursor-default"
                )}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
                onWheel={handleCanvasWheel}
              />

              {frames.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/60">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    {t("hint.noFramesTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("hint.noFramesBody")}
                  </p>
                </div>
              )}

              {frames.length > 0 && editorMode === "add" && viewMode === "frame" && (
                <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
                  {t("status.addMode")}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setCurrentFrameIndex(0)}
                        disabled={frames.length === 0}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("action.first")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          setCurrentFrameIndex((prev) => Math.max(0, prev - 1))
                        }
                        disabled={frames.length === 0}
                      >
                        <Rewind className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("action.previous")}</TooltipContent>
                  </Tooltip>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => setIsPlaying((prev) => !prev)}
                    disabled={frames.length === 0}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          setCurrentFrameIndex((prev) =>
                            Math.min(frames.length - 1, prev + 1)
                          )
                        }
                        disabled={frames.length === 0}
                      >
                        <FastForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("action.next")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() =>
                          setCurrentFrameIndex(Math.max(0, frames.length - 1))
                        }
                        disabled={frames.length === 0}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("action.last")}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="reverse-toggle"
                      checked={reverse}
                      onCheckedChange={setReverse}
                    />
                    <Label htmlFor="reverse-toggle">{t("label.reverse")}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="loop-toggle" checked={loop} onCheckedChange={setLoop} />
                    <Label htmlFor="loop-toggle">{t("label.loop")}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fps-input">{t("label.fps")}</Label>
                    <Input
                      id="fps-input"
                      type="number"
                      className="w-20"
                      value={String(fps)}
                      onChange={(event) =>
                        setFps(Math.max(1, toNumber(event.target.value, fps)))
                      }
                      min={1}
                    />
                  </div>
                  <Select
                    value={String(speed)}
                    onValueChange={(value) => setSpeed(Number(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder={t("label.speed")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SPEED_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs font-mono text-muted-foreground">
                  {t("status.frameCounter", {
                    current: frames.length ? currentFrameIndex + 1 : 0,
                    total: frames.length,
                  })}
                </div>
                <Slider
                  className="flex-1"
                  min={0}
                  max={Math.max(0, frames.length - 1)}
                  step={1}
                  value={[currentFrameIndex]}
                  onValueChange={(value) => setCurrentFrameIndex(value[0] ?? 0)}
                  disabled={frames.length === 0}
                />
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-4 rounded-none border-0 bg-card/80 p-4 shadow-none backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("panel.importExport")}
              </p>
              <h2 className="text-lg font-semibold">{t("panel.pipeline")}</h2>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
            <Label>{t("label.pngFrames")}</Label>
            <Input type="file" accept="image/png" multiple onChange={handleFramesImport} />
            <div className="text-xs text-muted-foreground">
              {t("hint.fileOrder")}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setFrames([]);
                setCurrentFrameIndex(0);
                setSelectedPointId(null);
                setIsPlaying(false);
              }}
              disabled={frames.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("action.clearFrames")}
            </Button>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
            <Label>{t("label.importJson")}</Label>
            <Input type="file" accept="application/json" onChange={handleJsonImport} />
            <div className="text-xs text-muted-foreground">
              {t("hint.jsonMatch")}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("label.atlasSettings")}</Label>
              {sizeMismatch && (
                <Badge variant="destructive" className="text-[10px]">
                  {t("status.sizeMismatch")}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rows-input">{t("label.rows")}</Label>
                <Input
                  id="rows-input"
                  type="number"
                  min={1}
                  value={String(rows)}
                  onChange={(event) =>
                    setRows(Math.max(1, toNumber(event.target.value, rows)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="padding-input">{t("label.padding")}</Label>
                <Input
                  id="padding-input"
                  type="number"
                  min={0}
                  value={String(padding)}
                  onChange={(event) =>
                    setPadding(Math.max(0, toNumber(event.target.value, padding)))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("status.cellSize", {
                  w: atlasLayout.cellWidth,
                  h: atlasLayout.cellHeight,
                })}
              </span>
              <span>
                {t("status.atlasSize", {
                  w: atlasLayout.width,
                  h: atlasLayout.height,
                })}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("label.export")}</Label>
            <div className="grid gap-2">
              <Button onClick={handleExportPng} disabled={frames.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {t("action.exportPng")}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportJson}
                disabled={frames.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("action.exportJson")}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("label.pivotSpace")}: {pivotLabels[pivotMode]}
            </div>
          </div>

          <Separator />

          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Upload className="h-4 w-4" />
              {t("hint.workflowTitle")}
            </div>
            <p>{t("hint.workflowStep1")}</p>
            <p>{t("hint.workflowStep2")}</p>
            <p>{t("hint.workflowStep3")}</p>
          </div>
        </aside>
      </div>
    </TooltipProvider>
  );
}

export default App;
