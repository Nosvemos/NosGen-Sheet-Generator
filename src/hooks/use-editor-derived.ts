import type { FrameData, FramePoint, PivotMode, PointGroup } from "@/lib/editor-types";
import { normalizeExportName, toPivotCoords } from "@/lib/editor-helpers";

type UseEditorDerivedParams = {
  frames: FrameData[];
  currentFrameIndex: number;
  currentFrame?: FrameData;
  selectedPoint: FramePoint | null;
  selectedPointKeyframes: Array<{ frameIndex: number; x: number; y: number }>;
  selectedAutoFillPositions: Array<{ x: number; y: number }> | null;
  selectedGroup: PointGroup | null;
  appMode: "character" | "animation" | "normal";
  fps: number;
  projectName: string;
  pivotMode: PivotMode;
};

export const useEditorDerived = ({
  frames,
  currentFrameIndex,
  currentFrame,
  selectedPoint,
  selectedPointKeyframes,
  selectedAutoFillPositions,
  selectedGroup,
  appMode,
  fps,
  projectName,
  pivotMode,
}: UseEditorDerivedParams) => {
  const selectedPivotCoords =
    selectedPoint && currentFrame
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

  return {
    selectedPivotCoords,
    selectedPivotX,
    selectedPivotY,
    keyframeCount,
    canAutoFill,
    canAddKeyframe,
    isCurrentFrameKeyframe,
    canRemoveKeyframe,
    canDeleteFrame,
    canMoveFrameLeft,
    canMoveFrameRight,
    canPreviewGroup,
    exportAtlasName,
    exportDataName,
    animationTotalSeconds,
    animationCurrentSeconds,
  };
};
