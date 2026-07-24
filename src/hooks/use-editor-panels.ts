import { useReducer } from "react";
import { useI18n } from "@/lib/use-i18n";
import { useToast } from "@/components/ui/use-toast";
import {
  createInitialEditorHistory,
  editorHistoryReducer,
} from "@/lib/editor-reducer";
import { buildEditorPanelProps } from "@/hooks/editor-panel-props";
import { useAtlasIO } from "@/hooks/use-atlas-io";
import { useEditorDerived } from "@/hooks/use-editor-derived";
import { useEditorExportActions } from "@/hooks/use-editor-export-actions";
import { useEditorHistoryHotkeys } from "@/hooks/use-editor-history-hotkeys";
import { useEditorStateSetters } from "@/hooks/use-editor-state-setters";
import { useEditorWorkspace } from "@/hooks/use-editor-workspace";
import { useRecentProjects } from "@/hooks/use-recent-projects";

export function useEditorPanels() {
  const { t, locale, setLocale } = useI18n();
  const { pushToast } = useToast();
  const [history, dispatch] = useReducer(
    editorHistoryReducer,
    undefined,
    createInitialEditorHistory
  );
  const state = history.present;
  const setters = useEditorStateSetters(dispatch);

  const workspace = useEditorWorkspace({
    t,
    state,
    setters,
    dispatch,
  });

  const atlasIO = useAtlasIO({
    t,
    frames: state.frames,
    setFrames: setters.setFrames,
    setCurrentFrameIndex: setters.setCurrentFrameIndex,
    setSelectedPointId: setters.setSelectedPointId,
    setIsPlaying: setters.setIsPlaying,
    setIsGroupPreviewActive: setters.setIsGroupPreviewActive,
    setIsGroupPreviewPlaying: setters.setIsGroupPreviewPlaying,
    setGroupPreviewIndex: setters.setGroupPreviewIndex,
    setPointGroups: setters.setPointGroups,
    setSelectedGroupId: setters.setSelectedGroupId,
    setSpriteDirection: setters.setSpriteDirection,
    setPivotMode: setters.setPivotMode,
    setRows: setters.setRows,
    setPadding: setters.setPadding,
    setAppMode: setters.setAppMode,
    setAnimationName: setters.setAnimationName,
    setFps: setters.setFps,
    setSpeed: setters.setSpeed,
    setLoop: setters.setLoop,
    setProjectName: setters.setProjectName,
    setExportSize: setters.setExportSize,
    setExportFormat: setters.setExportFormat,
    setAnimationFrameSelection: setters.setAnimationFrameSelection,
  });

  const recentProjects = useRecentProjects({
    state,
    dispatch,
    pushToast,
    t,
  });

  const derived = useEditorDerived({
    frames: state.frames,
    currentFrameIndex: state.currentFrameIndex,
    currentFrame: workspace.currentFrame,
    selectedPoint: workspace.selectedPoint,
    selectedPointKeyframes: workspace.selectedPointKeyframes,
    selectedAutoFillPositions: workspace.selectedAutoFillPositions,
    selectedGroup: workspace.selectedGroup,
    appMode: state.appMode,
    fps: state.fps,
    projectName: state.projectName,
    pivotMode: state.pivotMode,
  });

  const exportActions = useEditorExportActions({
    t,
    pushToast,
    state,
    selectedAnimationFrames: workspace.selectedAnimationFrames,
    exportAtlasName: derived.exportAtlasName,
    exportDataName: derived.exportDataName,
  });

  const historyHotkeys = useEditorHistoryHotkeys({
    history,
    dispatch,
    hotkeys: state.hotkeys,
    frames: state.frames,
    currentFrame: workspace.currentFrame,
    currentPoints: workspace.currentPoints,
    selectedPointId: state.selectedPointId,
    appMode: state.appMode,
    addPointAt: workspace.addPointAt,
    updateAllFramesPoints: workspace.updateAllFramesPoints,
    setters,
  });

  return buildEditorPanelProps({
    t,
    locale,
    setLocale,
    state,
    setters,
    workspace,
    derived,
    atlasIO,
    recentProjects,
    exportActions,
    historyHotkeys,
  });
}
