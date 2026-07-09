import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
} from "react";
import type {
  EditorState,
  EditorHistoryAction,
} from "@/lib/editor-reducer";
import type { StageTransform } from "@/lib/editor-types";
import type { Translate } from "@/hooks/atlas-io-types";
import type { useEditorStateSetters } from "@/hooks/use-editor-state-setters";
import { useAutoFill } from "@/hooks/use-auto-fill";
import { useCanvasRender } from "@/hooks/use-canvas-render";
import { useEditorSync } from "@/hooks/use-editor-sync";
import { useFrameTransform } from "@/hooks/use-frame-transform";
import { useGroupPreview } from "@/hooks/use-group-preview";
import { usePlayback } from "@/hooks/use-playback";
import { usePointsEditor } from "@/hooks/use-points-editor";
import { useStageInteractions } from "@/hooks/use-stage-interactions";
import { useStageSizing } from "@/hooks/use-stage-sizing";
import { useValidationAlerts } from "@/hooks/use-validation-alerts";
import { computeAtlasLayoutByMode } from "@/lib/editor-helpers";

type EditorStateSetters = ReturnType<typeof useEditorStateSetters>;

type UseEditorWorkspaceParams = {
  t: Translate;
  state: EditorState;
  setters: EditorStateSetters;
  dispatch: Dispatch<EditorHistoryAction>;
};

export const useEditorWorkspace = ({
  t,
  state,
  setters,
  dispatch,
}: UseEditorWorkspaceParams) => {
  const {
    frames,
    currentFrameIndex,
    selectedPointId,
    editorMode,
    pivotMode,
    viewMode,
    appMode,
    theme,
    rows,
    padding,
    showGrid,
    showPoints,
    frameZoom,
    panOffset,
    autoFillShape,
    autoFillSmoothing,
    spriteDirection,
    fps,
    speed,
    reverse,
    loop,
    isPlaying,
    atlasPackingMode,
    pointGroups,
    selectedGroupId,
    isGroupPreviewActive,
    isGroupPreviewPlaying,
    groupPreviewIndex,
    animationFrameSelection,
    isMagnetEnabled,
  } = state;
  const {
    setFrames,
    setFramesSilent,
    setCurrentFrameIndex,
    setSelectedPointId,
    setFrameZoom,
    setPanOffset,
    setIsPlaying,
    setIsGroupPreviewPlaying,
    setGroupPreviewIndex,
    setAnimationFrameSelectionSilent,
  } = setters;

  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<StageTransform | null>(null);
  const stageSize = useStageSizing({ stageRef, canvasRef });

  const currentFrame = frames[currentFrameIndex];
  const currentPoints = currentFrame?.points ?? [];
  const selectedPoint =
    currentPoints.find((point) => point.id === selectedPointId) ?? null;
  const selectedGroup =
    pointGroups.find((group) => group.id === selectedGroupId) ?? null;

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

  useEditorSync({
    theme,
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    selectedPointId,
    setSelectedPointId,
    setIsPlaying,
    currentFrame,
    setAnimationFrameSelection: setAnimationFrameSelectionSilent,
  });

  usePlayback({
    isPlaying,
    framesLength: frames.length,
    fps,
    speed,
    reverse,
    loop,
    setCurrentFrameIndex,
    setIsPlaying,
  });

  useGroupPreview({
    selectedGroup,
    isGroupPreviewPlaying,
    setIsGroupPreviewPlaying,
    setGroupPreviewIndex,
    fps,
    speed,
  });

  const {
    selectedPointKeyframes,
    selectedAutoFillModel,
    selectedAutoFillPositions,
    handleAutoFill,
  } = useAutoFill({
    frames,
    selectedPointId,
    selectedPoint,
    autoFillShape,
    spriteDirection,
    setFrames,
    isDraggingPoint: draggingPointId !== null,
  });

  const atlasLayout = useMemo(
    () =>
      computeAtlasLayoutByMode(frames, {
        mode: atlasPackingMode,
        rows,
        padding,
      }),
    [frames, atlasPackingMode, rows, padding]
  );

  const sizeMismatch = useMemo(() => {
    if (appMode === "normal") {
      return false;
    }
    if (frames.length < 2) {
      return false;
    }
    const base = frames[0];
    return frames.some(
      (frame) => frame.width !== base.width || frame.height !== base.height
    );
  }, [appMode, frames]);

  const unassignedPointsCount = useMemo(() => {
    if (frames.length === 0) {
      return 0;
    }
    const keyframeMap = new Map<string, boolean>();
    frames.forEach((frame) => {
      frame.points.forEach((point) => {
        const hasKeyframe = keyframeMap.get(point.id) ?? false;
        keyframeMap.set(point.id, hasKeyframe || Boolean(point.isKeyframe));
      });
    });
    let count = 0;
    keyframeMap.forEach((hasKeyframe) => {
      if (!hasKeyframe) {
        count += 1;
      }
    });
    return count;
  }, [frames]);

  const getFrameTransform = useFrameTransform({
    currentFrame,
    frameZoom,
    panOffset,
  });

  useCanvasRender({
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
  });

  useValidationAlerts({
    t,
    framesLength: frames.length,
    sizeMismatch,
    unassignedPointsCount,
    appMode,
  });

  const {
    updateCurrentFramePoints,
    updateCurrentFramePointsSilent,
    updateAllFramesPoints,
    addPointAt,
  } = usePointsEditor({
    frames,
    currentFrame,
    setFrames,
    setFramesSilent,
    setSelectedPointId,
    t,
  });

  const commitFramesHistory = useCallback(
    (before: EditorState["frames"], label: string) => {
      dispatch({
        type: "commit",
        patch: { frames },
        inverse: { frames: before },
        label,
      });
    },
    [dispatch, frames]
  );

  const {
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
  } = useStageInteractions({
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
  });

  return {
    stageRef,
    canvasRef,
    currentFrame,
    currentPoints,
    selectedPoint,
    selectedGroup,
    availablePoints,
    selectedAnimationFrames,
    selectedPointKeyframes,
    selectedAutoFillPositions,
    handleAutoFill,
    atlasLayout,
    sizeMismatch,
    updateCurrentFramePoints,
    updateAllFramesPoints,
    addPointAt,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
  };
};
