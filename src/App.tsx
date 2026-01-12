import { useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import type {
  AppMode,
  AtlasLayout,
  AutoFillModel,
  AutoFillShape,
  EditorMode,
  FrameData,
  FramePoint,
  KeyframePoint,
  PivotMode,
  PointGroup,
  SpriteDirection,
  StageTransform,
  ThemeMode,
  ViewMode,
} from "@/lib/editor-types";
import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { MainStage } from "@/components/editor/MainStage";
import { RightSidebar } from "@/components/editor/RightSidebar";

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
const MIN_EXPORT_SCALE = 0.5;
const MAX_EXPORT_SCALE = 4;
const EXPORT_SCALE_STEP = 0.5;
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

const createPointColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 55%)`;
};

const normalizeExportName = (value: string, fallback: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const safe = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return safe || fallback;
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

const solveLinear = (inputs: number[], outputs: number[]) => {
  const count = inputs.length;
  if (count === 0) {
    return { intercept: 0, slope: 0, valid: false };
  }
  let sumInput = 0;
  let sumInput2 = 0;
  let sumOutput = 0;
  let sumOutputInput = 0;
  for (let i = 0; i < count; i += 1) {
    const input = inputs[i];
    const output = outputs[i];
    sumInput += input;
    sumInput2 += input * input;
    sumOutput += output;
    sumOutputInput += output * input;
  }
  const det = count * sumInput2 - sumInput * sumInput;
  if (Math.abs(det) < 1e-6) {
    return {
      intercept: sumOutput / count,
      slope: 0,
      valid: false,
    };
  }
  const intercept = (sumOutput * sumInput2 - sumInput * sumOutputInput) / det;
  const slope = (count * sumOutputInput - sumInput * sumOutput) / det;
  return { intercept, slope, valid: true };
};

const computeEllipseFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) =>
      directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const xs = keyframes.map((point) => point.x);
  const ys = keyframes.map((point) => point.y);
  const phaseSteps = 720;
  let best:
    | {
        error: number;
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        phase: number;
      }
    | null = null;

  for (let step = 0; step < phaseSteps; step += 1) {
    const phase = (step / phaseSteps) * Math.PI * 2;
    const cosValues = baseAngles.map((angle) => Math.cos(angle + phase));
    const sinValues = baseAngles.map((angle) => Math.sin(angle + phase));
    const xFit = solveLinear(cosValues, xs);
    const yFit = solveLinear(sinValues, ys);
    const cx = xFit.intercept;
    const rx = xFit.slope;
    const cy = yFit.intercept;
    const ry = yFit.slope;
    let error = 0;
    for (let i = 0; i < keyframes.length; i += 1) {
      const dx = xs[i] - (cx + rx * cosValues[i]);
      const dy = ys[i] - (cy + ry * sinValues[i]);
      error += dx * dx + dy * dy;
    }
    if (!best || error < best.error) {
      best = { error, cx, cy, rx, ry, phase };
    }
  }
  if (!best) {
    return null;
  }
  const minRadius = 1;
  const rx =
    Math.abs(best.rx) < minRadius
      ? Math.sign(best.rx || 1) * minRadius
      : best.rx;
  const ry =
    Math.abs(best.ry) < minRadius
      ? Math.sign(best.ry || 1) * minRadius
      : best.ry;
  return { cx: best.cx, cy: best.cy, rx, ry, phase: best.phase };
};

const computeCircleFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const baseAngles = keyframes.map(
    (point) =>
      directionSign * (point.frameIndex / totalFrames) * Math.PI * 2
  );
  const xs = keyframes.map((point) => point.x);
  const ys = keyframes.map((point) => point.y);
  const phaseSteps = 720;
  let best:
    | {
        error: number;
        cx: number;
        cy: number;
        r: number;
        phase: number;
      }
    | null = null;

  for (let step = 0; step < phaseSteps; step += 1) {
    const phase = (step / phaseSteps) * Math.PI * 2;
    const cosValues = baseAngles.map((angle) => Math.cos(angle + phase));
    const sinValues = baseAngles.map((angle) => Math.sin(angle + phase));
    const count = keyframes.length;
    let sumC = 0;
    let sumS = 0;
    let sumX = 0;
    let sumY = 0;
    let sumXC = 0;
    let sumYS = 0;
    for (let i = 0; i < count; i += 1) {
      sumC += cosValues[i];
      sumS += sinValues[i];
      sumX += xs[i];
      sumY += ys[i];
      sumXC += xs[i] * cosValues[i];
      sumYS += ys[i] * sinValues[i];
    }
    const denom = count - 1;
    let r = 0;
    if (denom <= 0) {
      const avgX = sumX / count;
      const avgY = sumY / count;
      r =
        keyframes.reduce(
          (sum, point) => sum + Math.hypot(point.x - avgX, point.y - avgY),
          0
        ) / count;
    } else {
      const term = (sumC * sumX + sumS * sumY) / count;
      r = (sumXC + sumYS - term) / denom;
    }
    const cx = (sumX - r * sumC) / count;
    const cy = (sumY - r * sumS) / count;
    let error = 0;
    for (let i = 0; i < count; i += 1) {
      const dx = xs[i] - (cx + r * cosValues[i]);
      const dy = ys[i] - (cy + r * sinValues[i]);
      error += dx * dx + dy * dy;
    }
    if (!best || error < best.error) {
      best = { error, cx, cy, r, phase };
    }
  }
  if (!best) {
    return null;
  }
  const minRadius = 1;
  const r =
    Math.abs(best.r) < minRadius
      ? Math.sign(best.r || 1) * minRadius
      : best.r;
  return { cx: best.cx, cy: best.cy, r, phase: best.phase };
};

const normalizeCycle = (value: number) => ((value % 1) + 1) % 1;

const computeSquareParam = (
  point: KeyframePoint,
  cx: number,
  cy: number,
  size: number
) => {
  if (size <= 0) {
    return 0;
  }
  const dx = point.x - cx;
  const dy = point.y - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const clampAxis = (value: number) => clamp(value, -size, size);
  if (absX >= absY) {
    const y = clampAxis(dy);
    if (dx >= 0) {
      return (y + size) / (8 * size);
    }
    return (4 * size + (size - y)) / (8 * size);
  }
  const x = clampAxis(dx);
  if (dy >= 0) {
    return (2 * size + (size - x)) / (8 * size);
  }
  return (6 * size + (x + size)) / (8 * size);
};

const computeSquareFit = (
  keyframes: KeyframePoint[],
  totalFrames: number,
  direction: SpriteDirection
) => {
  if (keyframes.length < 2 || totalFrames <= 0) {
    return null;
  }
  const directionSign = direction === "clockwise" ? 1 : -1;
  const center = keyframes.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 }
  );
  const cx = center.x / keyframes.length;
  const cy = center.y / keyframes.length;
  const size = Math.max(
    1,
    ...keyframes.map((point) =>
      Math.max(Math.abs(point.x - cx), Math.abs(point.y - cy))
    )
  );
  const offsets = keyframes.map((point) => {
    const pointParam = computeSquareParam(point, cx, cy, size);
    const frameParam = directionSign * (point.frameIndex / totalFrames);
    return (pointParam - frameParam) * Math.PI * 2;
  });
  const avgSin = offsets.reduce((sum, value) => sum + Math.sin(value), 0);
  const avgCos = offsets.reduce((sum, value) => sum + Math.cos(value), 0);
  const phase =
    Math.atan2(avgSin / offsets.length, avgCos / offsets.length) /
    (Math.PI * 2);
  return { cx, cy, size, phase };
};

const squarePointAt = (
  cx: number,
  cy: number,
  size: number,
  turn: number
) => {
  const safeSize = Math.max(1, size);
  const normalized = normalizeCycle(turn);
  const perimeter = 8 * safeSize;
  const distance = normalized * perimeter;
  if (distance <= 2 * safeSize) {
    return { x: cx + safeSize, y: cy - safeSize + distance };
  }
  if (distance <= 4 * safeSize) {
    return {
      x: cx + safeSize - (distance - 2 * safeSize),
      y: cy + safeSize,
    };
  }
  if (distance <= 6 * safeSize) {
    return {
      x: cx - safeSize,
      y: cy + safeSize - (distance - 4 * safeSize),
    };
  }
  return {
    x: cx - safeSize + (distance - 6 * safeSize),
    y: cy - safeSize,
  };
};

const resolveCyclicSegment = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  const count = points.length;
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return {
      start: points[0],
      end: points[0],
      t: 0,
      startIndex: 0,
      endIndex: 0,
    };
  }
  const first = points[0];
  const last = points[count - 1];
  if (index <= first.frameIndex) {
    const span = first.frameIndex + totalFrames - last.frameIndex;
    const t = span === 0 ? 0 : (index + totalFrames - last.frameIndex) / span;
    return {
      start: last,
      end: first,
      t,
      startIndex: count - 1,
      endIndex: 0,
    };
  }
  if (index >= last.frameIndex) {
    const span = first.frameIndex + totalFrames - last.frameIndex;
    const t = span === 0 ? 0 : (index - last.frameIndex) / span;
    return {
      start: last,
      end: first,
      t,
      startIndex: count - 1,
      endIndex: 0,
    };
  }
  const endIndex = points.findIndex((item) => item.frameIndex >= index);
  const safeEndIndex = Math.max(1, endIndex);
  const startIndex = safeEndIndex - 1;
  const start = points[startIndex];
  const end = points[safeEndIndex];
  const span = end.frameIndex - start.frameIndex;
  const t = span === 0 ? 0 : (index - start.frameIndex) / span;
  return { start, end, t, startIndex, endIndex: safeEndIndex };
};

const interpolateLinear = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return { x: 0, y: 0 };
  }
  const segment = resolveCyclicSegment(points, index, totalFrames);
  if (!segment) {
    return { x: first.x, y: first.y };
  }
  const { start, end, t } = segment;
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
};

const catmullRom = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
) =>
  0.5 *
  (2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

const interpolateTangent = (
  points: KeyframePoint[],
  index: number,
  totalFrames: number
) => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const segment = resolveCyclicSegment(points, index, totalFrames);
  if (!segment) {
    return { x: points[0].x, y: points[0].y };
  }
  const { start, end, t, startIndex, endIndex } = segment;
  const count = points.length;
  const p0 = points[(startIndex - 1 + count) % count] ?? start;
  const p3 = points[(endIndex + 1) % count] ?? end;
  return {
    x: catmullRom(p0.x, start.x, end.x, p3.x, t),
    y: catmullRom(p0.y, start.y, end.y, p3.y, t),
  };
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
  const [appMode, setAppMode] = useState<AppMode>("character");
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
  const [autoFillShape, setAutoFillShape] =
    useState<AutoFillShape>("ellipse");
  const [spriteDirection, setSpriteDirection] =
    useState<SpriteDirection>("clockwise");
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [speed, setSpeed] = useState(1);
  const [reverse, setReverse] = useState(false);
  const [loop, setLoop] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [isKeyframesOpen, setIsKeyframesOpen] = useState(true);
  const [exportScale, setExportScale] = useState(1);
  const [exportSmoothing, setExportSmoothing] = useState(false);
  const [isSpriteSettingsOpen, setIsSpriteSettingsOpen] = useState(true);
  const [isAtlasSettingsOpen, setIsAtlasSettingsOpen] = useState(true);
  const [isExportQualityOpen, setIsExportQualityOpen] = useState(true);
  const [pointGroups, setPointGroups] = useState<PointGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupEntrySelection, setGroupEntrySelection] = useState<
    Record<string, string>
  >({});
  const [isGroupPreviewActive, setIsGroupPreviewActive] = useState(false);
  const [isGroupPreviewPlaying, setIsGroupPreviewPlaying] = useState(false);
  const [groupPreviewIndex, setGroupPreviewIndex] = useState(0);
  const [isPointsOpen, setIsPointsOpen] = useState(true);
  const [isPointGroupsOpen, setIsPointGroupsOpen] = useState(true);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(true);
  const [projectName, setProjectName] = useState("project");
  const [animationName, setAnimationName] = useState("animation");
  const [animationFrameSelection, setAnimationFrameSelection] = useState<
    Record<string, boolean>
  >({});

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<StageTransform | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const framesInputRef = useRef<HTMLInputElement>(null);
  const newPointsInputRef = useRef<HTMLInputElement>(null);
  const editAtlasPngInputRef = useRef<HTMLInputElement>(null);
  const editAtlasJsonInputRef = useRef<HTMLInputElement>(null);
  const [editAtlasPngFile, setEditAtlasPngFile] = useState<File | null>(null);
  const [editAtlasJsonFile, setEditAtlasJsonFile] = useState<File | null>(null);
  const [isEditImporting, setIsEditImporting] = useState(false);
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
  const selectedPointKeyframes = useMemo(() => {
    if (!selectedPointId) {
      return [];
    }
    const keyframes = frames.flatMap((frame, frameIndex) => {
      const point = frame.points.find((item) => item.id === selectedPointId);
      if (point && point.isKeyframe) {
        return [
          {
            frameIndex,
            x: point.x,
            y: point.y,
          },
        ];
      }
      return [];
    });
    return keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
  }, [frames, selectedPointId]);

  const availablePoints = useMemo(() => {
    const baseFrame = frames[0];
    if (!baseFrame) {
      return [];
    }
    return baseFrame.points.map((point) => ({
      id: point.id,
      name: point.name,
      color: point.color,
    }));
  }, [frames]);

  const selectedGroup =
    pointGroups.find((group) => group.id === selectedGroupId) ?? null;

  const groupPreviewIds = useMemo(() => {
    if (!isGroupPreviewActive || !selectedGroup) {
      return null;
    }
    if (selectedGroup.entries.length === 0) {
      return null;
    }
    return selectedGroup.entries[
      Math.max(0, Math.min(groupPreviewIndex, selectedGroup.entries.length - 1))
    ];
  }, [groupPreviewIndex, isGroupPreviewActive, selectedGroup]);

  const isCharacterMode = appMode === "character";
  const selectedAnimationFrames = useMemo(
    () => frames.filter((frame) => animationFrameSelection[frame.id]),
    [animationFrameSelection, frames]
  );

  const selectedAutoFillModel = useMemo<AutoFillModel | null>(() => {
    if (selectedPointKeyframes.length < 2 || frames.length === 0) {
      return null;
    }
    if (autoFillShape === "linear") {
      return { shape: "linear", points: selectedPointKeyframes };
    }
    if (autoFillShape === "tangent") {
      return { shape: "tangent", points: selectedPointKeyframes };
    }
    if (autoFillShape === "circle") {
      const circle = computeCircleFit(
        selectedPointKeyframes,
        frames.length,
        spriteDirection
      );
      return circle ? { shape: "circle", ...circle } : null;
    }
    if (autoFillShape === "square") {
      const square = computeSquareFit(
        selectedPointKeyframes,
        frames.length,
        spriteDirection
      );
      return square ? { shape: "square", ...square } : null;
    }
    const ellipse = computeEllipseFit(
      selectedPointKeyframes,
      frames.length,
      spriteDirection
    );
    return ellipse ? { shape: "ellipse", ...ellipse } : null;
  }, [
    autoFillShape,
    frames.length,
    selectedPointKeyframes,
    spriteDirection,
  ]);

  const selectedAutoFillPositions = useMemo(() => {
    if (!selectedAutoFillModel || frames.length === 0) {
      return null;
    }
    const totalFrames = frames.length;
    const directionSign = spriteDirection === "clockwise" ? 1 : -1;
    const positions = Array.from({ length: totalFrames }, (_, index) => {
      if (selectedAutoFillModel.shape === "ellipse") {
        const angle =
          directionSign * (index / totalFrames) * Math.PI * 2 +
          selectedAutoFillModel.phase;
        return {
          x: selectedAutoFillModel.cx +
            selectedAutoFillModel.rx * Math.cos(angle),
          y: selectedAutoFillModel.cy +
            selectedAutoFillModel.ry * Math.sin(angle),
        };
      }
      if (selectedAutoFillModel.shape === "circle") {
        const angle =
          directionSign * (index / totalFrames) * Math.PI * 2 +
          selectedAutoFillModel.phase;
        return {
          x: selectedAutoFillModel.cx + selectedAutoFillModel.r * Math.cos(angle),
          y: selectedAutoFillModel.cy + selectedAutoFillModel.r * Math.sin(angle),
        };
      }
      if (selectedAutoFillModel.shape === "square") {
        const turn = directionSign * (index / totalFrames) +
          selectedAutoFillModel.phase;
        return squarePointAt(
          selectedAutoFillModel.cx,
          selectedAutoFillModel.cy,
          selectedAutoFillModel.size,
          turn
        );
      }
      if (selectedAutoFillModel.shape === "tangent") {
        return interpolateTangent(
          selectedAutoFillModel.points,
          index,
          totalFrames
        );
      }
      return interpolateLinear(selectedAutoFillModel.points, index, totalFrames);
    });
    selectedPointKeyframes.forEach((keyframe) => {
      if (keyframe.frameIndex >= 0 && keyframe.frameIndex < positions.length) {
        positions[keyframe.frameIndex] = { x: keyframe.x, y: keyframe.y };
      }
    });
    return positions;
  }, [
    frames.length,
    selectedAutoFillModel,
    selectedPointKeyframes,
    spriteDirection,
  ]);

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

  const importPointsJsonToFrames = (
    parsed: unknown,
    baseFrames: FrameData[]
  ): {
    frames: FrameData[];
    spriteDirection?: SpriteDirection;
    pivotMode?: PivotMode;
  } => {
    if (!parsed || typeof parsed !== "object") {
      return { frames: baseFrames };
    }
    const payload = parsed as {
      meta?: {
        pivot?: unknown;
        pivotMode?: unknown;
        spriteDirection?: unknown;
      };
      frames?: unknown;
    };
    const pivotRaw = payload.meta?.pivot ?? payload.meta?.pivotMode;
    const pivotMode =
      pivotRaw === "top-left" ||
      pivotRaw === "bottom-left" ||
      pivotRaw === "center"
        ? pivotRaw
        : undefined;
    const spriteDirection =
      payload.meta?.spriteDirection === "clockwise" ||
      payload.meta?.spriteDirection === "counterclockwise"
        ? payload.meta?.spriteDirection
        : undefined;
    const nameToId = new Map<string, string>();
    const nameToColor = new Map<string, string>();
    const buildPoint = (
      name: string,
      point: { x?: number; y?: number },
      frame: FrameData
    ) => {
      const id = nameToId.get(name) ?? createId();
      nameToId.set(name, id);
      const color = nameToColor.get(name) ?? createPointColor();
      nameToColor.set(name, color);
      const pivotPoint = {
        x: Number(point.x ?? 0),
        y: Number(point.y ?? 0),
      };
      const framePoint = fromPivotCoords(
        pivotPoint,
        frame,
        pivotMode ?? "top-left"
      );
      return {
        id,
        name,
        color,
        x: clamp(Math.round(framePoint.x), 0, frame.width),
        y: clamp(Math.round(framePoint.y), 0, frame.height),
        isKeyframe: true,
      };
    };

    const framesPayload = Array.isArray(payload.frames)
      ? (payload.frames as Array<{ name?: string; filename?: string; id?: string; points?: unknown }>)
      : null;
    if (framesPayload) {
      const nextFrames = baseFrames.map((frame) => {
        const match = framesPayload.find(
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
            return buildPoint(name, point, frame);
          }
        );
        return { ...frame, points: nextPoints };
      });
      return { frames: nextFrames, spriteDirection, pivotMode };
    }

    const entries = Object.entries(payload).filter(
      ([key, value]) => key !== "meta" && Array.isArray(value)
    );
    if (entries.length === 0) {
      return { frames: baseFrames, spriteDirection, pivotMode };
    }
    const nextFrames = baseFrames.map((frame, frameIndex) => {
      const nextPoints = entries.map(([rawName, rawPoints], index) => {
        const name =
          typeof rawName === "string" && rawName.length > 0
            ? rawName
            : t("point.defaultName", { index: index + 1 });
        const id = nameToId.get(name) ?? createId();
        nameToId.set(name, id);
        const color = nameToColor.get(name) ?? createPointColor();
        nameToColor.set(name, color);
        const pointList = Array.isArray(rawPoints) ? rawPoints : [];
        const entry = pointList[frameIndex];
        let x = 0;
        let y = 0;
        let isKeyframe = false;
        if (Array.isArray(entry) && entry.length >= 2) {
          const rawX = Number(entry[0]);
          const rawY = Number(entry[1]);
          if (Number.isFinite(rawX) && Number.isFinite(rawY)) {
            const framePoint = fromPivotCoords(
              { x: rawX, y: rawY },
              frame,
              pivotMode ?? "top-left"
            );
            x = clamp(Math.round(framePoint.x), 0, frame.width);
            y = clamp(Math.round(framePoint.y), 0, frame.height);
            isKeyframe = true;
          }
        }
        return {
          id,
          name,
          color,
          x,
          y,
          isKeyframe,
        };
      });
      return { ...frame, points: nextPoints };
    });
    return { frames: nextFrames, spriteDirection, pivotMode };
  };

  const buildGroupsFromJson = (parsed: unknown, baseFrames: FrameData[]) => {
    if (!parsed || typeof parsed !== "object") {
      return [];
    }
    const payload = parsed as { groups?: Record<string, unknown> };
    if (!payload.groups || typeof payload.groups !== "object") {
      return [];
    }
    const nameToId = new Map<string, string>();
    baseFrames[0]?.points.forEach((point) => {
      nameToId.set(point.name, point.id);
    });
    return Object.entries(payload.groups).map(([name, rawEntries]) => {
      const entries = Array.isArray(rawEntries) ? rawEntries : [];
      const mappedEntries = entries.map((entry) => {
        if (!Array.isArray(entry)) {
          return [];
        }
        return entry
          .map((pointName) =>
            typeof pointName === "string" ? nameToId.get(pointName) : undefined
          )
          .filter(Boolean) as string[];
      });
      return {
        id: createId(),
        name,
        entries: mappedEntries,
      };
    });
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load ${file.name}`));
      };
      img.src = url;
    });

  const getFrameTransform = (viewWidth: number, viewHeight: number) => {
    if (!currentFrame) {
      return null;
    }
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
    return {
      scale,
      offsetX,
      offsetY,
      frameWidth: currentFrame.width,
      frameHeight: currentFrame.height,
      viewWidth,
      viewHeight,
    };
  };

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

  const handleAutoFill = () => {
    if (!selectedPoint || !selectedAutoFillPositions || frames.length === 0) {
      return;
    }
    setFrames((prev) =>
      prev.map((frame, index) => {
        const point = frame.points.find((item) => item.id === selectedPoint.id);
        if (!point || point.isKeyframe) {
          return frame;
        }
        const target = selectedAutoFillPositions[index];
        if (!target) {
          return frame;
        }
        const nextX = clamp(Math.round(target.x), 0, frame.width);
        const nextY = clamp(Math.round(target.y), 0, frame.height);
        return {
          ...frame,
          points: frame.points.map((item) =>
            item.id === selectedPoint.id
              ? { ...item, x: nextX, y: nextY }
              : item
          ),
        };
      })
    );
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
    setAnimationFrameSelection((prev) => {
      const next: Record<string, boolean> = {};
      frames.forEach((frame) => {
        next[frame.id] = prev[frame.id] ?? true;
      });
      return next;
    });
  }, [frames]);

  useEffect(() => {
    if (!editAtlasPngFile || !editAtlasJsonFile) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsEditImporting(true);
      try {
        await handleEditAtlasImport(editAtlasPngFile, editAtlasJsonFile);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setIsEditImporting(false);
          setEditAtlasPngFile(null);
          setEditAtlasJsonFile(null);
          if (editAtlasPngInputRef.current) {
            editAtlasPngInputRef.current.value = "";
          }
          if (editAtlasJsonInputRef.current) {
            editAtlasJsonInputRef.current.value = "";
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [editAtlasPngFile, editAtlasJsonFile]);

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
    if (!selectedGroup) {
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
      return;
    }
    if (selectedGroup.entries.length === 0) {
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
      return;
    }
    setGroupPreviewIndex((prev) =>
      Math.max(0, Math.min(prev, selectedGroup.entries.length - 1))
    );
  }, [selectedGroup]);

  useEffect(() => {
    if (
      !isGroupPreviewPlaying ||
      !selectedGroup ||
      selectedGroup.entries.length === 0
    ) {
      return;
    }
    const safeFps = Math.max(1, fps);
    const intervalMs = 1000 / (safeFps * speed);
    const timer = window.setInterval(() => {
      setGroupPreviewIndex((prev) =>
        selectedGroup.entries.length === 0
          ? 0
          : (prev + 1) % selectedGroup.entries.length
      );
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    isGroupPreviewPlaying,
    selectedGroup?.id,
    selectedGroup?.entries.length,
    fps,
    speed,
  ]);

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
      "rgba(255, 255, 255, 0.6)",
      0.9
    );
    const checkerAlt = toHslColor(
      styles.getPropertyValue("--muted"),
      "rgba(233, 233, 233, 0.7)",
      0.75
    );
    const gridColor = toHslColor(
      styles.getPropertyValue("--border"),
      "rgba(20, 20, 20, 0.08)",
      0.6
    );
    const frameOutline = toHslColor(
      styles.getPropertyValue("--border"),
      "rgba(18, 24, 33, 0.2)",
      0.5
    );
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    drawCheckerboard(ctx, viewWidth, viewHeight, 18, checkerBase, checkerAlt);

    if (viewMode === "frame" && currentFrame) {
      const transform = getFrameTransform(viewWidth, viewHeight);
      if (!transform) {
        return;
      }
      const { scale, offsetX, offsetY } = transform;
      const drawWidth = currentFrame.width * scale;
      const drawHeight = currentFrame.height * scale;

      transformRef.current = transform;

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
        const targetScreenStep = 16;
        const gridStep = Math.max(1, Math.round(targetScreenStep / scale));
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

      if (showPoints && selectedPoint && selectedAutoFillPositions) {
        const shouldClose =
          selectedAutoFillModel?.shape === "ellipse" ||
          selectedAutoFillModel?.shape === "circle" ||
          selectedAutoFillModel?.shape === "square" ||
          selectedAutoFillModel?.shape === "tangent";
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = selectedPoint.color || accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        selectedAutoFillPositions.forEach((point, index) => {
          const px = offsetX + point.x * scale;
          const py = offsetY + point.y * scale;
          if (index === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        if (shouldClose && selectedAutoFillPositions.length > 0) {
          const first = selectedAutoFillPositions[0];
          ctx.lineTo(offsetX + first.x * scale, offsetY + first.y * scale);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (showPoints && isCharacterMode) {
        const pointsToRender = groupPreviewIds
          ? currentPoints.filter((point) => groupPreviewIds.includes(point.id))
          : currentPoints;
        pointsToRender.forEach((point) => {
          const px = offsetX + point.x * scale;
          const py = offsetY + point.y * scale;
          const isSelected = point.id === selectedPointId;
          ctx.beginPath();
          ctx.fillStyle = point.color || accentColor;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
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
    groupPreviewIds,
    selectedAutoFillModel,
    selectedAutoFillPositions,
    selectedPoint,
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
    const color = createPointColor();
    const ratioX = currentFrame.width ? x / currentFrame.width : 0;
    const ratioY = currentFrame.height ? y / currentFrame.height : 0;

    updateAllFramesPoints((points, frame) => {
      const isCurrentFrame = frame.id === currentFrame.id;
      const frameX = isCurrentFrame
        ? clamp(Math.round(frame.width * ratioX), 0, frame.width)
        : 0;
      const frameY = isCurrentFrame
        ? clamp(Math.round(frame.height * ratioY), 0, frame.height)
        : 0;
      const point: FramePoint = {
        id: pointId,
        name,
        color,
        x: frameX,
        y: frameY,
        isKeyframe: isCurrentFrame,
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
    if (!canvas) {
      return;
    }
    if (event.button === 1) {
      event.preventDefault();
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: panOffset.x,
        originY: panOffset.y,
      };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (!isCharacterMode) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const transform = getFrameTransform(rect.width, rect.height);
    if (!transform) {
      return;
    }
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
        Math.hypot(point.x - frameX, point.y - frameY) <= hitRadius
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
      if (panRef.current && viewMode === "frame") {
        const { startX, startY, originX, originY } = panRef.current;
        setPanOffset({
          x: originX + (event.clientX - startX),
          y: originY + (event.clientY - startY),
        });
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const transform = getFrameTransform(rect.width, rect.height);
    if (!transform) {
      return;
    }
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    const frameX = (rawX - transform.offsetX) / transform.scale;
    const frameY = (rawY - transform.offsetY) / transform.scale;
    const clampedX = clamp(Math.round(frameX), 0, currentFrame.width);
    const clampedY = clamp(Math.round(frameY), 0, currentFrame.height);
    updateCurrentFramePoints((points) =>
      points.map((point) =>
        point.id === draggingPointId
          ? { ...point, x: clampedX, y: clampedY, isKeyframe: true }
          : point
      )
    );
  };

  const handleCanvasPointerUp = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (panRef.current && panRef.current.pointerId === event.pointerId) {
      canvasRef.current?.releasePointerCapture(event.pointerId);
      panRef.current = null;
      return;
    }
    if (draggingPointId) {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    }
    setDraggingPointId(null);
  };

  const handleNewAtlasCreate = async () => {
    const files = framesInputRef.current?.files;
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
    const pointsFile = newPointsInputRef.current?.files?.[0] ?? null;
    try {
      const loaded = await Promise.all(
        pngFiles.map((file) => loadFrameFromFile(file))
      );
      let nextFrames = loaded;
      if (pointsFile) {
        const raw = await pointsFile.text();
        const parsed = JSON.parse(raw);
        const imported = importPointsJsonToFrames(parsed, nextFrames);
        nextFrames = imported.frames;
        if (imported.spriteDirection) {
          setSpriteDirection(imported.spriteDirection);
        }
        if (imported.pivotMode) {
          setPivotMode(imported.pivotMode);
        }
        const groups = buildGroupsFromJson(parsed, nextFrames);
        setPointGroups(groups);
        setSelectedGroupId(groups[0]?.id ?? null);
      } else {
        setPointGroups([]);
        setSelectedGroupId(null);
      }
      setFrames(nextFrames);
      setCurrentFrameIndex(0);
      setSelectedPointId(null);
      setIsPlaying(false);
      setIsGroupPreviewActive(false);
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      if (framesInputRef.current) {
        framesInputRef.current.value = "";
      }
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleNewPointsImport = async (file: File) => {
    if (frames.length === 0) {
      return;
    }
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const imported = importPointsJsonToFrames(parsed, frames);
      setFrames(imported.frames);
      if (imported.spriteDirection) {
        setSpriteDirection(imported.spriteDirection);
      }
      if (imported.pivotMode) {
        setPivotMode(imported.pivotMode);
      }
      const groups = buildGroupsFromJson(parsed, imported.frames);
      setPointGroups(groups);
      setSelectedGroupId(groups[0]?.id ?? null);
      setSelectedPointId(null);
      setIsGroupPreviewActive(false);
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleClearFrames = () => {
    setFrames([]);
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
  };

  const handleEditAtlasImport = async (pngFile: File, jsonFile: File) => {
    const raw = await jsonFile.text();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.frames)) {
      return;
    }
    const atlasImage = await loadImageFromFile(pngFile);
    const entries = parsed.frames
      .map((entry: { name?: string; filename?: string; id?: string; w?: number; h?: number; width?: number; height?: number; x?: number; y?: number }) => {
        const width = Number(entry.w ?? entry.width ?? 0);
        const height = Number(entry.h ?? entry.height ?? 0);
        const x = Number(entry.x ?? 0);
        const y = Number(entry.y ?? 0);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          return null;
        }
        if (width <= 0 || height <= 0) {
          return null;
        }
        return {
          name: entry.name || entry.filename || entry.id || "frame",
          x,
          y,
          w: width,
          h: height,
        };
      })
      .filter(Boolean) as { name: string; x: number; y: number; w: number; h: number }[];
    const framesFromAtlas = await Promise.all(
      entries.map(async (entry, index) => {
        const canvas = document.createElement("canvas");
        canvas.width = entry.w;
        canvas.height = entry.h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return null;
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          atlasImage,
          entry.x,
          entry.y,
          entry.w,
          entry.h,
          0,
          0,
          entry.w,
          entry.h
        );
        const dataUrl = canvas.toDataURL("image/png");
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to slice atlas frame"));
          img.src = dataUrl;
        });
        return {
          id: createId(),
          name: entry.name || `frame-${index + 1}`,
          image: img,
          width: entry.w,
          height: entry.h,
          points: [],
        } as FrameData;
      })
    );
    const validFrames = framesFromAtlas.filter(Boolean) as FrameData[];
    if (validFrames.length === 0) {
      return;
    }
    const imported = importPointsJsonToFrames(parsed, validFrames);
    let nextFrames = imported.frames;
    if (imported.spriteDirection) {
      setSpriteDirection(imported.spriteDirection);
    }
    if (imported.pivotMode) {
      setPivotMode(imported.pivotMode);
    }
    if (Number.isFinite(Number(parsed?.meta?.rows))) {
      setRows(Math.max(1, Math.round(Number(parsed.meta.rows))));
    }
    if (Number.isFinite(Number(parsed?.meta?.padding))) {
      setPadding(Math.max(0, Math.round(Number(parsed.meta.padding))));
    }
    if (parsed?.meta?.mode === "animation" || parsed?.meta?.mode === "character") {
      setAppMode(parsed.meta.mode);
    }
    if (parsed?.animation) {
      if (typeof parsed.animation.name === "string") {
        setAnimationName(parsed.animation.name);
      }
      if (Number.isFinite(Number(parsed.animation.fps))) {
        setFps(Math.max(1, Math.round(Number(parsed.animation.fps))));
      }
      if (Number.isFinite(Number(parsed.animation.speed))) {
        setSpeed(Number(parsed.animation.speed));
      }
      if (typeof parsed.animation.loop === "boolean") {
        setLoop(parsed.animation.loop);
      }
    }
    if (typeof pngFile.name === "string") {
      const baseName = pngFile.name.replace(/\.[^/.]+$/, "");
      const trimmed = baseName.endsWith("_atlas")
        ? baseName.slice(0, -6)
        : baseName;
      if (trimmed) {
        setProjectName(trimmed);
      }
    }
    const importedGroups = buildGroupsFromJson(parsed, nextFrames);
    setPointGroups(importedGroups);
    setSelectedGroupId(importedGroups[0]?.id ?? null);
    if (parsed?.animation?.frames && Array.isArray(parsed.animation.frames)) {
      const selection = new Set(
        parsed.animation.frames.filter((name: unknown) => typeof name === "string")
      );
      setAnimationFrameSelection(() => {
        const next: Record<string, boolean> = {};
        nextFrames.forEach((frame) => {
          next[frame.id] = selection.has(frame.name);
        });
        return next;
      });
    }
    setFrames(nextFrames);
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
    setIsGroupPreviewActive(false);
    setIsGroupPreviewPlaying(false);
    setGroupPreviewIndex(0);
  };

  const handleExportPng = () => {
    if (frames.length === 0) {
      return;
    }
    const layout = computeAtlasLayout(frames, rows, padding);
    const scale = clamp(exportScale, MIN_EXPORT_SCALE, MAX_EXPORT_SCALE);
    const targetWidth = Math.max(1, Math.round(layout.width * scale));
    const targetHeight = Math.max(1, Math.round(layout.height * scale));
    const scaleX = targetWidth / layout.width;
    const scaleY = targetHeight / layout.height;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = exportSmoothing;
    if (exportSmoothing) {
      ctx.imageSmoothingQuality = "high";
    }
    layout.positions.forEach((cell, index) => {
      const frame = frames[index];
      if (!frame) {
        return;
      }
      const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
      const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
      ctx.drawImage(
        frame.image,
        (cell.x + offsetX) * scaleX,
        (cell.y + offsetY) * scaleY,
        frame.width * scaleX,
        frame.height * scaleY
      );
    });
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${exportAtlasName}.png`);
      }
    });
  };

  const handleExportJson = () => {
    if (frames.length === 0) {
      return;
    }
    const layout = computeAtlasLayout(frames, rows, padding);
    const includePoints = isCharacterMode;
    const exportedFrames = frames.map((frame, index) => {
      const cell = layout.positions[index];
      const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
      const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
      const base = {
        name: frame.name,
        x: cell.x + offsetX,
        y: cell.y + offsetY,
        w: frame.width,
        h: frame.height,
      };
      if (!includePoints) {
        return base;
      }
      return {
        ...base,
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

    let groups: Record<string, string[][]> | undefined;
    if (includePoints && pointGroups.length > 0) {
      const idToName = new Map<string, string>();
      frames[0]?.points.forEach((point) => {
        idToName.set(point.id, point.name);
      });
      groups = pointGroups.reduce<Record<string, string[][]>>(
        (acc, group) => {
          const safeName = group.name || `group-${group.id.slice(0, 6)}`;
          acc[safeName] = group.entries.map((entry) =>
            entry.map((id) => idToName.get(id) ?? id)
          );
          return acc;
        },
        {}
      );
    }

    const animation =
      appMode === "animation"
        ? {
            name: animationName.trim() || "animation",
            fps,
            speed,
            loop,
            frames: selectedAnimationFrames.map((frame) => frame.name),
          }
        : undefined;

    const payload = {
      meta: {
        app: "NosGen",
        image: `${exportAtlasName}.png`,
        size: { w: layout.width, h: layout.height },
        rows: layout.rows,
        columns: layout.columns,
        padding: layout.padding,
        pivot: pivotMode,
        spriteDirection,
        mode: appMode,
      },
      ...(groups ? { groups } : {}),
      ...(animation ? { animation } : {}),
      frames: exportedFrames,
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
      `${exportDataName}.json`
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
  const keyframeCount = selectedPointKeyframes.length;
  const canAutoFill = Boolean(selectedAutoFillPositions);
  const canAddKeyframe = Boolean(selectedPoint && currentFrame);
  const isCurrentFrameKeyframe = selectedPoint?.isKeyframe ?? false;
  const canRemoveKeyframe = Boolean(selectedPoint && isCurrentFrameKeyframe);
  const canDeleteFrame = frames.length > 0;
  const canMoveFrameLeft = currentFrameIndex > 0;
  const canMoveFrameRight = currentFrameIndex < frames.length - 1;
  const canPreviewGroup =
    Boolean(selectedGroup) && (selectedGroup?.entries.length ?? 0) > 0;
  const exportBaseName = normalizeExportName(projectName, "sprite-atlas");
  const exportAtlasName = `${exportBaseName}_atlas`;
  const exportDataName = `${exportBaseName}_data`;
  const animationTotalSeconds =
    appMode === "animation" && fps > 0 ? frames.length / fps : 0;
  const animationCurrentSeconds =
    appMode === "animation" && fps > 0 ? currentFrameIndex / fps : 0;

  return (
    <TooltipProvider>
      <div className="h-screen w-full divide-y divide-border/60 overflow-hidden p-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0 lg:gap-0">
        <LeftSidebar
          t={t}
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          isProjectSettingsOpen={isProjectSettingsOpen}
          setIsProjectSettingsOpen={setIsProjectSettingsOpen}
          appMode={appMode}
          setAppMode={setAppMode}
          projectName={projectName}
          setProjectName={setProjectName}
          pivotMode={pivotMode}
          setPivotMode={setPivotMode}
          pivotLabels={pivotLabels}
          pivotOptions={PIVOT_OPTIONS}
          animationName={animationName}
          setAnimationName={setAnimationName}
          animationFrameSelection={animationFrameSelection}
          setAnimationFrameSelection={setAnimationFrameSelection}
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          currentFrame={currentFrame}
          addPointAt={addPointAt}
          currentPoints={currentPoints}
          selectedPointId={selectedPointId}
          setSelectedPointId={setSelectedPointId}
          isPointsOpen={isPointsOpen}
          setIsPointsOpen={setIsPointsOpen}
          toPivotCoords={toPivotCoords}
          selectedPoint={selectedPoint}
          updateAllFramesPoints={updateAllFramesPoints}
          selectedPivotX={selectedPivotX}
          selectedPivotY={selectedPivotY}
          updateCurrentFramePoints={updateCurrentFramePoints}
          fromPivotCoords={fromPivotCoords}
          clamp={clamp}
          toNumber={toNumber}
          isKeyframesOpen={isKeyframesOpen}
          setIsKeyframesOpen={setIsKeyframesOpen}
          keyframeCount={keyframeCount}
          setFrames={setFrames}
          selectedPointKeyframes={selectedPointKeyframes}
          autoFillShape={autoFillShape}
          setAutoFillShape={setAutoFillShape}
          handleAutoFill={handleAutoFill}
          canAutoFill={canAutoFill}
          availablePoints={availablePoints}
          pointGroups={pointGroups}
          setPointGroups={setPointGroups}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          isPointGroupsOpen={isPointGroupsOpen}
          setIsPointGroupsOpen={setIsPointGroupsOpen}
          selectedGroup={selectedGroup}
          groupEntrySelection={groupEntrySelection}
          setGroupEntrySelection={setGroupEntrySelection}
          isGroupPreviewActive={isGroupPreviewActive}
          setIsGroupPreviewActive={setIsGroupPreviewActive}
          isGroupPreviewPlaying={isGroupPreviewPlaying}
          setIsGroupPreviewPlaying={setIsGroupPreviewPlaying}
          groupPreviewIndex={groupPreviewIndex}
          setGroupPreviewIndex={setGroupPreviewIndex}
          canPreviewGroup={canPreviewGroup}
          createId={createId}
        />
        <MainStage
          t={t}
          theme={theme}
          setTheme={setTheme}
          currentFrame={currentFrame}
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          setCurrentFrameIndex={setCurrentFrameIndex}
          atlasLayout={atlasLayout}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showPoints={showPoints}
          setShowPoints={setShowPoints}
          stageRef={stageRef}
          canvasRef={canvasRef}
          editorMode={editorMode}
          handleCanvasPointerDown={handleCanvasPointerDown}
          handleCanvasPointerMove={handleCanvasPointerMove}
          handleCanvasPointerUp={handleCanvasPointerUp}
          handleCanvasWheel={handleCanvasWheel}
          framesInputRef={framesInputRef}
          selectedPoint={selectedPoint}
          selectedPointKeyframes={selectedPointKeyframes}
          fps={fps}
          setFps={setFps}
          speed={speed}
          setSpeed={setSpeed}
          reverse={reverse}
          setReverse={setReverse}
          loop={loop}
          setLoop={setLoop}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setSelectedPointId={setSelectedPointId}
          canAddKeyframe={canAddKeyframe}
          canRemoveKeyframe={canRemoveKeyframe}
          isCurrentFrameKeyframe={isCurrentFrameKeyframe}
          updateCurrentFramePoints={updateCurrentFramePoints}
          canMoveFrameLeft={canMoveFrameLeft}
          canMoveFrameRight={canMoveFrameRight}
          canDeleteFrame={canDeleteFrame}
          setFrames={setFrames}
          appMode={appMode}
          animationCurrentSeconds={animationCurrentSeconds}
          animationTotalSeconds={animationTotalSeconds}
          speedOptions={SPEED_OPTIONS}
          toNumber={toNumber}
        />
        <RightSidebar
          t={t}
          framesLength={frames.length}
          framesInputRef={framesInputRef}
          newPointsInputRef={newPointsInputRef}
          handleNewAtlasCreate={handleNewAtlasCreate}
          handleNewPointsImport={handleNewPointsImport}
          onClearFrames={handleClearFrames}
          editAtlasPngInputRef={editAtlasPngInputRef}
          editAtlasJsonInputRef={editAtlasJsonInputRef}
          setEditAtlasPngFile={setEditAtlasPngFile}
          setEditAtlasJsonFile={setEditAtlasJsonFile}
          isEditImporting={isEditImporting}
          isSpriteSettingsOpen={isSpriteSettingsOpen}
          setIsSpriteSettingsOpen={setIsSpriteSettingsOpen}
          spriteDirection={spriteDirection}
          setSpriteDirection={setSpriteDirection}
          isAtlasSettingsOpen={isAtlasSettingsOpen}
          setIsAtlasSettingsOpen={setIsAtlasSettingsOpen}
          rows={rows}
          setRows={setRows}
          padding={padding}
          setPadding={setPadding}
          atlasLayout={atlasLayout}
          sizeMismatch={sizeMismatch}
          toNumber={toNumber}
          isExportQualityOpen={isExportQualityOpen}
          setIsExportQualityOpen={setIsExportQualityOpen}
          exportScale={exportScale}
          setExportScale={setExportScale}
          exportSmoothing={exportSmoothing}
          setExportSmoothing={setExportSmoothing}
          handleExportPng={handleExportPng}
          handleExportJson={handleExportJson}
          pivotMode={pivotMode}
          pivotLabels={pivotLabels}
          minExportScale={MIN_EXPORT_SCALE}
          maxExportScale={MAX_EXPORT_SCALE}
          exportScaleStep={EXPORT_SCALE_STEP}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
