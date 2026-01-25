import { useRef, useState } from "react";
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
  updateCurrentFramePoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
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
  updateCurrentFramePoints,
  setSelectedPointId,
}: UseStageInteractionsParams) => {
  const panRef = useRef<PanState | null>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const snapThreshold = 3;

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
    const rect = canvas.getBoundingClientRect();
    const transform = getFrameTransform(rect.width, rect.height);
    if (!transform) {
      return;
    }
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    const frameX = (rawX - transform.offsetX) / transform.scale;
    const frameY = (rawY - transform.offsetY) / transform.scale;
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
    updateCurrentFramePoints((points) =>
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
