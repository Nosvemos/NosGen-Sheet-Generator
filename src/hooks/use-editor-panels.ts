import { useMemo, useReducer, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import type { LeftSidebarProps } from "@/components/editor/LeftSidebar";
import type { MainStageProps } from "@/components/editor/MainStage";
import type { RightSidebarProps } from "@/components/editor/RightSidebar";
import type { StageTransform } from "@/lib/editor-types";
import {
  createInitialEditorState,
  createStateSetter,
  editorReducer,
} from "@/lib/editor-reducer";
import { useAutoFill } from "@/hooks/use-auto-fill";
import { useAtlasIO } from "@/hooks/use-atlas-io";
import { useCanvasRender } from "@/hooks/use-canvas-render";
import { useEditorDerived } from "@/hooks/use-editor-derived";
import { useEditorSync } from "@/hooks/use-editor-sync";
import { useFrameTransform } from "@/hooks/use-frame-transform";
import { useGroupPreview } from "@/hooks/use-group-preview";
import { usePlayback } from "@/hooks/use-playback";
import { usePointsEditor } from "@/hooks/use-points-editor";
import { useStageInteractions } from "@/hooks/use-stage-interactions";
import { useStageSizing } from "@/hooks/use-stage-sizing";
import { exportAtlasJson, exportAtlasPng } from "@/lib/editor-io";
import {
  EXPORT_SCALE_STEP,
  MAX_EXPORT_SCALE,
  MIN_EXPORT_SCALE,
  PIVOT_OPTIONS,
  SPEED_OPTIONS,
  clamp,
  computeAtlasLayout,
  createId,
  fromPivotCoords,
  toNumber,
  toPivotCoords,
} from "@/lib/editor-helpers";

export function useEditorPanels() {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(
    editorReducer,
    undefined,
    createInitialEditorState
  );
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
    spriteDirection,
    fps,
    speed,
    reverse,
    loop,
    isPlaying,
    isKeyframesOpen,
    exportScale,
    exportSmoothing,
    isSpriteSettingsOpen,
    isAtlasSettingsOpen,
    isExportQualityOpen,
    pointGroups,
    selectedGroupId,
    newGroupName,
    groupEntrySelection,
    isGroupPreviewActive,
    isGroupPreviewPlaying,
    groupPreviewIndex,
    isPointsOpen,
    isPointGroupsOpen,
    isProjectSettingsOpen,
    projectName,
    animationName,
    animationFrameSelection,
  } = state;

  const setters = useMemo(
    () => ({
      setFrames: createStateSetter(dispatch, "frames"),
      setCurrentFrameIndex: createStateSetter(dispatch, "currentFrameIndex"),
      setSelectedPointId: createStateSetter(dispatch, "selectedPointId"),
      setEditorMode: createStateSetter(dispatch, "editorMode"),
      setPivotMode: createStateSetter(dispatch, "pivotMode"),
      setViewMode: createStateSetter(dispatch, "viewMode"),
      setAppMode: createStateSetter(dispatch, "appMode"),
      setTheme: createStateSetter(dispatch, "theme"),
      setRows: createStateSetter(dispatch, "rows"),
      setPadding: createStateSetter(dispatch, "padding"),
      setShowGrid: createStateSetter(dispatch, "showGrid"),
      setShowPoints: createStateSetter(dispatch, "showPoints"),
      setFrameZoom: createStateSetter(dispatch, "frameZoom"),
      setPanOffset: createStateSetter(dispatch, "panOffset"),
      setAutoFillShape: createStateSetter(dispatch, "autoFillShape"),
      setSpriteDirection: createStateSetter(dispatch, "spriteDirection"),
      setFps: createStateSetter(dispatch, "fps"),
      setSpeed: createStateSetter(dispatch, "speed"),
      setReverse: createStateSetter(dispatch, "reverse"),
      setLoop: createStateSetter(dispatch, "loop"),
      setIsPlaying: createStateSetter(dispatch, "isPlaying"),
      setIsKeyframesOpen: createStateSetter(dispatch, "isKeyframesOpen"),
      setExportScale: createStateSetter(dispatch, "exportScale"),
      setExportSmoothing: createStateSetter(dispatch, "exportSmoothing"),
      setIsSpriteSettingsOpen: createStateSetter(dispatch, "isSpriteSettingsOpen"),
      setIsAtlasSettingsOpen: createStateSetter(dispatch, "isAtlasSettingsOpen"),
      setIsExportQualityOpen: createStateSetter(dispatch, "isExportQualityOpen"),
      setPointGroups: createStateSetter(dispatch, "pointGroups"),
      setSelectedGroupId: createStateSetter(dispatch, "selectedGroupId"),
      setNewGroupName: createStateSetter(dispatch, "newGroupName"),
      setGroupEntrySelection: createStateSetter(dispatch, "groupEntrySelection"),
      setIsGroupPreviewActive: createStateSetter(dispatch, "isGroupPreviewActive"),
      setIsGroupPreviewPlaying: createStateSetter(
        dispatch,
        "isGroupPreviewPlaying"
      ),
      setGroupPreviewIndex: createStateSetter(dispatch, "groupPreviewIndex"),
      setIsPointsOpen: createStateSetter(dispatch, "isPointsOpen"),
      setIsPointGroupsOpen: createStateSetter(dispatch, "isPointGroupsOpen"),
      setIsProjectSettingsOpen: createStateSetter(
        dispatch,
        "isProjectSettingsOpen"
      ),
      setProjectName: createStateSetter(dispatch, "projectName"),
      setAnimationName: createStateSetter(dispatch, "animationName"),
      setAnimationFrameSelection: createStateSetter(
        dispatch,
        "animationFrameSelection"
      ),
    }),
    [dispatch]
  );
  const {
    setFrames,
    setCurrentFrameIndex,
    setSelectedPointId,
    setEditorMode,
    setPivotMode,
    setViewMode,
    setAppMode,
    setTheme,
    setRows,
    setPadding,
    setShowGrid,
    setShowPoints,
    setFrameZoom,
    setPanOffset,
    setAutoFillShape,
    setSpriteDirection,
    setFps,
    setSpeed,
    setReverse,
    setLoop,
    setIsPlaying,
    setIsKeyframesOpen,
    setExportScale,
    setExportSmoothing,
    setIsSpriteSettingsOpen,
    setIsAtlasSettingsOpen,
    setIsExportQualityOpen,
    setPointGroups,
    setSelectedGroupId,
    setNewGroupName,
    setGroupEntrySelection,
    setIsGroupPreviewActive,
    setIsGroupPreviewPlaying,
    setGroupPreviewIndex,
    setIsPointsOpen,
    setIsPointGroupsOpen,
    setIsProjectSettingsOpen,
    setProjectName,
    setAnimationName,
    setAnimationFrameSelection,
  } = setters;

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<StageTransform | null>(null);
  const stageSize = useStageSizing({ stageRef, canvasRef });

  const currentFrame = frames[currentFrameIndex];
  const currentPoints = currentFrame?.points ?? [];
  const selectedPoint =
    currentPoints.find((point) => point.id === selectedPointId) ?? null;
  const pivotLabels: Record<PivotMode, string> = {
    "top-left": t("pivot.topLeft"),
    "bottom-left": t("pivot.bottomLeft"),
    center: t("pivot.center"),
  };

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

  useEditorSync({
    theme,
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    selectedPointId,
    setSelectedPointId,
    setIsPlaying,
    currentFrame,
    setAnimationFrameSelection,
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
    framesInputRef,
    newPointsInputRef,
    editAtlasPngInputRef,
    editAtlasJsonInputRef,
    setEditAtlasPngFile,
    setEditAtlasJsonFile,
    isEditImporting,
    handleNewAtlasCreate,
    handleNewPointsImport,
    handleClearFrames,
  } = useAtlasIO({
    t,
    frames,
    setFrames,
    setCurrentFrameIndex,
    setSelectedPointId,
    setIsPlaying,
    setIsGroupPreviewActive,
    setIsGroupPreviewPlaying,
    setGroupPreviewIndex,
    setPointGroups,
    setSelectedGroupId,
    setSpriteDirection,
    setPivotMode,
    setRows,
    setPadding,
    setAppMode,
    setAnimationName,
    setFps,
    setSpeed,
    setLoop,
    setProjectName,
    setAnimationFrameSelection,
  });

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
  });

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
    isCharacterMode,
    getFrameTransform,
    transformRef,
    frameZoom,
    panOffset,
  });

  const { updateCurrentFramePoints, updateAllFramesPoints, addPointAt } =
    usePointsEditor({
      frames,
      currentFrame,
      setFrames,
      setSelectedPointId,
      t,
    });

  const {
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
  } = useStageInteractions({
    canvasRef,
    currentFrame,
    currentPoints,
    viewMode,
    isCharacterMode,
    editorMode,
    frameZoom,
    setFrameZoom,
    panOffset,
    setPanOffset,
    stageSize,
    getFrameTransform,
    addPointAt,
    updateCurrentFramePoints,
    setSelectedPointId,
  });

  const handleExportPng = () => {
    exportAtlasPng({
      frames,
      rows,
      padding,
      exportScale,
      exportSmoothing,
      exportAtlasName,
      minScale: MIN_EXPORT_SCALE,
      maxScale: MAX_EXPORT_SCALE,
    });
  };

  const handleExportJson = () => {
    exportAtlasJson({
      frames,
      rows,
      padding,
      pivotMode,
      spriteDirection,
      appMode,
      pointGroups,
      animationName,
      fps,
      speed,
      loop,
      selectedAnimationFrames,
      exportAtlasName,
      exportDataName,
    });
  };

  const {
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
  } = useEditorDerived({
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
  });

  const leftSidebar: LeftSidebarProps = {
    t,
    frames,
    currentFrameIndex,
    isProjectSettingsOpen,
    setIsProjectSettingsOpen,
    appMode,
    setAppMode,
    projectName,
    setProjectName,
    pivotMode,
    setPivotMode,
    pivotLabels,
    pivotOptions: PIVOT_OPTIONS,
    animationName,
    setAnimationName,
    animationFrameSelection,
    setAnimationFrameSelection,
    editorMode,
    setEditorMode,
    currentFrame,
    addPointAt,
    currentPoints,
    selectedPointId,
    setSelectedPointId,
    isPointsOpen,
    setIsPointsOpen,
    toPivotCoords,
    selectedPoint,
    updateAllFramesPoints,
    selectedPivotX,
    selectedPivotY,
    updateCurrentFramePoints,
    fromPivotCoords,
    clamp,
    toNumber,
    isKeyframesOpen,
    setIsKeyframesOpen,
    keyframeCount,
    setFrames,
    selectedPointKeyframes,
    autoFillShape,
    setAutoFillShape,
    handleAutoFill,
    canAutoFill,
    availablePoints,
    pointGroups,
    setPointGroups,
    selectedGroupId,
    setSelectedGroupId,
    newGroupName,
    setNewGroupName,
    isPointGroupsOpen,
    setIsPointGroupsOpen,
    selectedGroup,
    groupEntrySelection,
    setGroupEntrySelection,
    isGroupPreviewActive,
    setIsGroupPreviewActive,
    isGroupPreviewPlaying,
    setIsGroupPreviewPlaying,
    groupPreviewIndex,
    setGroupPreviewIndex,
    canPreviewGroup,
    createId,
  };

  const mainStage: MainStageProps = {
    t,
    theme,
    setTheme,
    currentFrame,
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    atlasLayout,
    viewMode,
    setViewMode,
    showGrid,
    setShowGrid,
    showPoints,
    setShowPoints,
    stageRef,
    canvasRef,
    editorMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
    framesInputRef,
    selectedPoint,
    selectedPointKeyframes,
    fps,
    setFps,
    speed,
    setSpeed,
    reverse,
    setReverse,
    loop,
    setLoop,
    isPlaying,
    setIsPlaying,
    setSelectedPointId,
    canAddKeyframe,
    canRemoveKeyframe,
    isCurrentFrameKeyframe,
    updateCurrentFramePoints,
    canMoveFrameLeft,
    canMoveFrameRight,
    canDeleteFrame,
    setFrames,
    appMode,
    animationCurrentSeconds,
    animationTotalSeconds,
    speedOptions: SPEED_OPTIONS,
    toNumber,
  };

  const rightSidebar: RightSidebarProps = {
    t,
    framesLength: frames.length,
    framesInputRef,
    newPointsInputRef,
    handleNewAtlasCreate,
    handleNewPointsImport,
    onClearFrames: handleClearFrames,
    editAtlasPngInputRef,
    editAtlasJsonInputRef,
    setEditAtlasPngFile,
    setEditAtlasJsonFile,
    isEditImporting,
    isSpriteSettingsOpen,
    setIsSpriteSettingsOpen,
    spriteDirection,
    setSpriteDirection,
    isAtlasSettingsOpen,
    setIsAtlasSettingsOpen,
    rows,
    setRows,
    padding,
    setPadding,
    atlasLayout,
    sizeMismatch,
    toNumber,
    isExportQualityOpen,
    setIsExportQualityOpen,
    exportScale,
    setExportScale,
    exportSmoothing,
    setExportSmoothing,
    handleExportPng,
    handleExportJson,
    pivotMode,
    pivotLabels,
    minExportScale: MIN_EXPORT_SCALE,
    maxExportScale: MAX_EXPORT_SCALE,
    exportScaleStep: EXPORT_SCALE_STEP,
  };

  return { leftSidebar, mainStage, rightSidebar };
}
