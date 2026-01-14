import { useMemo, useReducer, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import type { LeftSidebarProps } from "@/components/editor/LeftSidebar";
import type { MainStageProps } from "@/components/editor/MainStage";
import type { RightSidebarProps } from "@/components/editor/RightSidebar";
import type { StageTransform } from "@/lib/editor-types";
import {
  createInitialEditorHistory,
  createStateSetter,
  editorHistoryReducer,
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
import { useValidationAlerts } from "@/hooks/use-validation-alerts";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { exportAtlasJson, exportAtlasPng } from "@/lib/editor-io";
import { DEFAULT_HOTKEYS } from "@/lib/hotkeys";
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
  const [history, dispatch] = useReducer(
    editorHistoryReducer,
    undefined,
    createInitialEditorHistory
  );
  const state = history.present;
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
    isSettingsOpen,
    historyLimit,
    hotkeys,
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

  const setters = useMemo(() => {
    const silent = { history: "ignore" as const };
    return {
      setFrames: createStateSetter(dispatch, "frames"),
      setCurrentFrameIndex: createStateSetter(
        dispatch,
        "currentFrameIndex",
        silent
      ),
      setSelectedPointId: createStateSetter(dispatch, "selectedPointId", silent),
      setEditorMode: createStateSetter(dispatch, "editorMode"),
      setPivotMode: createStateSetter(dispatch, "pivotMode"),
      setViewMode: createStateSetter(dispatch, "viewMode", silent),
      setAppMode: createStateSetter(dispatch, "appMode", silent),
      setTheme: createStateSetter(dispatch, "theme", silent),
      setRows: createStateSetter(dispatch, "rows"),
      setPadding: createStateSetter(dispatch, "padding"),
      setShowGrid: createStateSetter(dispatch, "showGrid", silent),
      setShowPoints: createStateSetter(dispatch, "showPoints", silent),
      setFrameZoom: createStateSetter(dispatch, "frameZoom", silent),
      setPanOffset: createStateSetter(dispatch, "panOffset", silent),
      setAutoFillShape: createStateSetter(dispatch, "autoFillShape"),
      setSpriteDirection: createStateSetter(dispatch, "spriteDirection"),
      setFps: createStateSetter(dispatch, "fps"),
      setSpeed: createStateSetter(dispatch, "speed"),
      setReverse: createStateSetter(dispatch, "reverse"),
      setLoop: createStateSetter(dispatch, "loop"),
      setIsPlaying: createStateSetter(dispatch, "isPlaying", silent),
      setIsKeyframesOpen: createStateSetter(dispatch, "isKeyframesOpen"),
      setExportScale: createStateSetter(dispatch, "exportScale"),
      setExportSmoothing: createStateSetter(dispatch, "exportSmoothing"),
      setIsSpriteSettingsOpen: createStateSetter(dispatch, "isSpriteSettingsOpen"),
      setIsAtlasSettingsOpen: createStateSetter(dispatch, "isAtlasSettingsOpen"),
      setIsExportQualityOpen: createStateSetter(dispatch, "isExportQualityOpen"),
      setIsSettingsOpen: createStateSetter(dispatch, "isSettingsOpen", silent),
      setHistoryLimit: createStateSetter(
        dispatch,
        "historyLimit",
        silent
      ),
      setHotkeys: createStateSetter(dispatch, "hotkeys", silent),
      setPointGroups: createStateSetter(dispatch, "pointGroups"),
      setSelectedGroupId: createStateSetter(dispatch, "selectedGroupId"),
      setNewGroupName: createStateSetter(dispatch, "newGroupName"),
      setGroupEntrySelection: createStateSetter(dispatch, "groupEntrySelection"),
      setIsGroupPreviewActive: createStateSetter(dispatch, "isGroupPreviewActive"),
      setIsGroupPreviewPlaying: createStateSetter(
        dispatch,
        "isGroupPreviewPlaying",
        silent
      ),
      setGroupPreviewIndex: createStateSetter(
        dispatch,
        "groupPreviewIndex",
        silent
      ),
      setIsPointsOpen: createStateSetter(dispatch, "isPointsOpen", silent),
      setIsPointGroupsOpen: createStateSetter(
        dispatch,
        "isPointGroupsOpen",
        silent
      ),
      setIsProjectSettingsOpen: createStateSetter(
        dispatch,
        "isProjectSettingsOpen",
        silent
      ),
      setProjectName: createStateSetter(dispatch, "projectName"),
      setAnimationName: createStateSetter(dispatch, "animationName"),
      setAnimationFrameSelection: createStateSetter(
        dispatch,
        "animationFrameSelection"
      ),
      setAnimationFrameSelectionSilent: createStateSetter(
        dispatch,
        "animationFrameSelection",
        silent
      ),
    };
  }, [dispatch]);
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
    setIsSettingsOpen,
    setHistoryLimit,
    setHotkeys,
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
    setAnimationFrameSelectionSilent,
  } = setters;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const historyEntries = useMemo(
    () =>
      history.past
        .slice(-5)
        .map((entry) => entry.label)
        .reverse(),
    [history.past]
  );
  const undoCount = history.past.length;
  const redoCount = history.future.length;

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

  const handleUndo = () => {
    if (!canUndo) {
      return;
    }
    dispatch({ type: "undo" });
    setIsPlaying(false);
  };

  const handleRedo = () => {
    if (!canRedo) {
      return;
    }
    dispatch({ type: "redo" });
    setIsPlaying(false);
  };

  const handleResetHotkeys = () => {
    setHotkeys(DEFAULT_HOTKEYS);
  };

  const handleClearHistory = () => {
    dispatch({ type: "clearHistory" });
  };

  useHotkeys({
    hotkeys,
    handlers: {
      undo: handleUndo,
      redo: handleRedo,
      playPause: () => {
        if (frames.length === 0) {
          return;
        }
        setIsPlaying((prev) => !prev);
      },
      nextFrame: () => {
        if (frames.length === 0) {
          return;
        }
        setCurrentFrameIndex((prev) =>
          Math.min(frames.length - 1, prev + 1)
        );
      },
      prevFrame: () => {
        if (frames.length === 0) {
          return;
        }
        setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
      },
      firstFrame: () => {
        if (frames.length === 0) {
          return;
        }
        setCurrentFrameIndex(0);
      },
      lastFrame: () => {
        if (frames.length === 0) {
          return;
        }
        setCurrentFrameIndex(Math.max(0, frames.length - 1));
      },
      toggleGrid: () => setShowGrid((prev) => !prev),
      togglePoints: () => setShowPoints((prev) => !prev),
      selectMode: () => setEditorMode("select"),
      addMode: () => setEditorMode("add"),
      addPoint: () => {
        if (!currentFrame || appMode !== "character") {
          return;
        }
        addPointAt(currentFrame.width / 2, currentFrame.height / 2);
      },
      deletePoint: () => {
        if (!selectedPointId || appMode !== "character") {
          return;
        }
        updateAllFramesPoints((points) =>
          points.filter((point) => point.id !== selectedPointId)
        );
        setSelectedPointId(null);
      },
      selectNextPoint: () => {
        if (currentPoints.length === 0) {
          return;
        }
        const currentIndex = currentPoints.findIndex(
          (point) => point.id === selectedPointId
        );
        const nextIndex =
          currentIndex >= 0
            ? (currentIndex + 1) % currentPoints.length
            : 0;
        setSelectedPointId(currentPoints[nextIndex].id);
      },
      selectPrevPoint: () => {
        if (currentPoints.length === 0) {
          return;
        }
        const currentIndex = currentPoints.findIndex(
          (point) => point.id === selectedPointId
        );
        const nextIndex =
          currentIndex >= 0
            ? (currentIndex - 1 + currentPoints.length) %
              currentPoints.length
            : currentPoints.length - 1;
        setSelectedPointId(currentPoints[nextIndex].id);
      },
    },
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
    isSettingsOpen,
    setIsSettingsOpen,
    historyLimit,
    setHistoryLimit,
    hotkeys,
    setHotkeys,
    onResetHotkeys: handleResetHotkeys,
    historyEntries,
    undoCount,
    redoCount,
    onClearHistory: handleClearHistory,
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
    canUndo,
    canRedo,
    onUndo: handleUndo,
    onRedo: handleRedo,
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
