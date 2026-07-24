import { useRef } from "react";
import type {
  Dispatch,
  PointerEvent,
  RefObject,
  SetStateAction,
  WheelEvent,
} from "react";
import type {
  EditorMode,
  FrameData,
  FramePoint,
  StageTransform,
  ViewMode,
} from "@/lib/editor-types";
import {
  clamp,
  MAX_FRAME_ZOOM,
  MIN_FRAME_ZOOM,
  ZOOM_STEP,
} from "@/lib/editor-helpers";

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type FramePointerPosition = {
  frameX: number;
  frameY: number;
  scale: number;
};

type UseStageInteractionsParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentFrame: FrameData | undefined;
  currentPoints: FramePoint[];
  frames: FrameData[];
  viewMode: ViewMode;
  isCharacterMode: boolean;
  editorMode: EditorMode;
  isMagnetEnabled: boolean;
  frameZoom: number;
  setFrameZoom: Dispatch<SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  stageSize: { width: number; height: number };
  getFrameTransform: (
    viewWidth: number,
    viewHeight: number
  ) => StageTransform | null;
  addPointAt: (x: number, y: number) => void;
  updateCurrentFramePointsSilent: (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => void;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  draggingPointId: string | null;
  setDraggingPointId: Dispatch<SetStateAction<string | null>>;
  commitFramesHistory: (before: FrameData[], label: string) => void;
};

export const useStageInteractions = ({
  canvasRef,
  currentFrame,
  currentPoints,
  frames,
  viewMode,
  isCharacterMode,
  editorMode,
  isMagnetEnabled,
  frameZoom,
  setFrameZoom,
  panOffset,
  setPanOffset,
  stageSize,
  getFrameTransform,
  addPointAt,
  updateCurrentFramePointsSilent,
  setSelectedPointId,
  draggingPointId,
  setDraggingPointId,
  commitFramesHistory,
}: UseStageInteractionsParams) => {
  const panRef = useRef<PanState | null>(null);
  const dragStartFramesRef = useRef<FrameData[] | null>(null);
  const snapThreshold = 3;

  const getFramePointerPosition = (
    event: PointerEvent<HTMLCanvasElement>
  ): FramePointerPosition | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const transform = getFrameTransform(rect.width, rect.height);
    if (!transform) {
      return null;
    }
    return {
      frameX: (event.clientX - rect.left - transform.offsetX) / transform.scale,
      frameY: (event.clientY - rect.top - transform.offsetY) / transform.scale,
      scale: transform.scale,
    };
  };

  const findPointHit = (
    frameX: number,
    frameY: number,
    hitRadius: number
  ) =>
    currentPoints.find(
      (point) => Math.hypot(point.x - frameX, point.y - frameY) <= hitRadius
    );

  const beginPan = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    event.preventDefault();
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };
    canvas.setPointerCapture(event.pointerId);
  };

  const resolveSnap = (value: number, candidates: number[]) => {
    let closest = value;
    let bestDiff = snapThreshold + 1;
    candidates.forEach((candidate) => {
      const diff = Math.abs(candidate - value);
      if (diff <= snapThreshold && diff < bestDiff) {
        bestDiff = diff;
        closest = candidate;
      }
    });
    return closest;
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLCanvasElement>) => {
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

  const handleCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!currentFrame || viewMode !== "frame") {
      return;
    }

    // Double click resets zoom & pan
    if (event.detail === 2) {
      setFrameZoom(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    // Middle click, right click, or Space/Shift + Left click activates Pan mode
    if (
      event.button === 1 ||
      event.button === 2 ||
      (event.button === 0 && event.shiftKey)
    ) {
      beginPan(event);
      return;
    }
    if (!isCharacterMode) {
      if (event.button === 2) {
        beginPan(event);
      }
      return;
    }
    const pointer = getFramePointerPosition(event);
    if (!pointer) {
      return;
    }
    const { frameX, frameY, scale } = pointer;
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const hitRadius = Math.max(4, 10 / scale);
    const hit = findPointHit(frameX, frameY, hitRadius);

    if (event.button === 2) {
      if (!hit) {
        beginPan(event);
      }
      return;
    }

    if (
      editorMode === "add" &&
      frameX >= 0 &&
      frameY >= 0 &&
      frameX <= currentFrame.width &&
      frameY <= currentFrame.height
    ) {
      const clampedX = clamp(Math.round(frameX), 0, currentFrame.width);
      const clampedY = clamp(Math.round(frameY), 0, currentFrame.height);
      addPointAt(clampedX, clampedY);
      return;
    }

    if (hit) {
      setSelectedPointId(hit.id);
      setDraggingPointId(hit.id);
      // Snapshot frames so the whole drag commits as one undo step on release.
      dragStartFramesRef.current = frames;
      canvas.setPointerCapture(event.pointerId);
    } else {
      setSelectedPointId(null);
    }
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
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
    const pointer = getFramePointerPosition(event);
    if (!pointer) {
      return;
    }
    const { frameX, frameY } = pointer;
    let clampedX = clamp(Math.round(frameX), 0, currentFrame.width);
    let clampedY = clamp(Math.round(frameY), 0, currentFrame.height);
    if (isMagnetEnabled && draggingPointId) {
      const xCandidates: number[] = [];
      const yCandidates: number[] = [];
      frames.forEach((frame) => {
        if (frame.id === currentFrame.id) {
          return;
        }
        const point = frame.points.find((item) => item.id === draggingPointId);
        if (!point || !point.isKeyframe) {
          return;
        }
        if (point.x >= 0 && point.x <= currentFrame.width) {
          xCandidates.push(point.x);
        }
        if (point.y >= 0 && point.y <= currentFrame.height) {
          yCandidates.push(point.y);
        }
      });
      if (xCandidates.length > 0) {
        clampedX = resolveSnap(clampedX, xCandidates);
      }
      if (yCandidates.length > 0) {
        clampedY = resolveSnap(clampedY, yCandidates);
      }
    }
    updateCurrentFramePointsSilent((points) =>
      points.map((point) =>
        point.id === draggingPointId
          ? { ...point, x: clampedX, y: clampedY, isKeyframe: true }
          : point
      )
    );
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (panRef.current && panRef.current.pointerId === event.pointerId) {
      canvasRef.current?.releasePointerCapture(event.pointerId);
      panRef.current = null;
      return;
    }
    if (draggingPointId) {
      canvasRef.current?.releasePointerCapture(event.pointerId);
      // Record the entire drag as a single undo step (frames were updated
      // silently during the move).
      const before = dragStartFramesRef.current;
      if (before && before !== frames) {
        commitFramesHistory(before, "Point moved");
      }
      dragStartFramesRef.current = null;
    }
    setDraggingPointId(null);
  };

  return {
    handleCanvasWheel,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  };
};
