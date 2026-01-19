import { useEffect } from "react";
import type { RefObject } from "react";
import type {
  AtlasLayout,
  AutoFillModel,
  FrameData,
  FramePoint,
  KeyframePoint,
  PivotMode,
  StageTransform,
  ThemeMode,
  ViewMode,
} from "@/lib/editor-types";
import { renderCanvas } from "@/lib/canvas-render";

type UseCanvasRenderParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stageSize: { width: number; height: number };
  theme: ThemeMode;
  viewMode: ViewMode;
  currentFrame?: FrameData;
  frames: FrameData[];
  atlasLayout: AtlasLayout;
  currentFrameIndex: number;
  showGrid: boolean;
  showPoints: boolean;
  pivotMode: PivotMode;
  groupPreviewIds: string[] | null;
  currentPoints: FramePoint[];
  selectedPointId: string | null;
  selectedPoint: FramePoint | null;
  selectedAutoFillModel: AutoFillModel | null;
  selectedAutoFillPositions: Array<{ x: number; y: number }> | null;
  selectedPointKeyframes: KeyframePoint[];
  autoFillSmoothing: boolean;
  isCharacterMode: boolean;
  getFrameTransform: (
    viewWidth: number,
    viewHeight: number
  ) => StageTransform | null;
  transformRef: RefObject<StageTransform | null>;
  frameZoom: number;
  panOffset: { x: number; y: number };
};

export const useCanvasRender = ({
  canvasRef,
  stageSize,
  theme,
  viewMode,
  currentFrame,
  frames,
  atlasLayout,
  currentFrameIndex,
  showGrid,
  showPoints,
  pivotMode,
  groupPreviewIds,
  currentPoints,
  selectedPointId,
  selectedPoint,
  selectedAutoFillModel,
  selectedAutoFillPositions,
  selectedPointKeyframes,
  autoFillSmoothing,
  isCharacterMode,
  getFrameTransform,
  transformRef,
  frameZoom,
  panOffset,
}: UseCanvasRenderParams) => {
  useEffect(() => {
    renderCanvas({
      canvas: canvasRef.current,
      stageSize,
      viewMode,
      currentFrame,
      frames,
      atlasLayout,
      currentFrameIndex,
      showGrid,
      showPoints,
      pivotMode,
      groupPreviewIds,
      currentPoints,
      selectedPointId,
      selectedPoint,
      selectedAutoFillModel,
      selectedAutoFillPositions,
      selectedPointKeyframes,
      autoFillSmoothing,
      isCharacterMode,
      getFrameTransform,
      transformRef,
    });
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
    selectedPointKeyframes,
    autoFillSmoothing,
    selectedPoint,
    selectedPointId,
    showGrid,
    showPoints,
    stageSize,
    theme,
    viewMode,
    getFrameTransform,
    canvasRef,
    transformRef,
    isCharacterMode,
  ]);
};
