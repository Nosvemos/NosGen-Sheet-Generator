import { useMemo } from "react";
import type { Dispatch } from "react";
import {
  createStateSetter,
  type EditorHistoryAction,
} from "@/lib/editor-reducer";

export const useEditorStateSetters = (
  dispatch: Dispatch<EditorHistoryAction>
) =>
  useMemo(() => {
    const silent = { history: "ignore" as const };
    return {
      setFrames: createStateSetter(dispatch, "frames"),
      setFramesSilent: createStateSetter(dispatch, "frames", silent),
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
      setAutoFillSmoothing: createStateSetter(dispatch, "autoFillSmoothing"),
      setSpriteDirection: createStateSetter(dispatch, "spriteDirection"),
      setFps: createStateSetter(dispatch, "fps"),
      setSpeed: createStateSetter(dispatch, "speed"),
      setReverse: createStateSetter(dispatch, "reverse"),
      setLoop: createStateSetter(dispatch, "loop"),
      setIsPlaying: createStateSetter(dispatch, "isPlaying", silent),
      setIsKeyframesOpen: createStateSetter(dispatch, "isKeyframesOpen"),
      setExportScale: createStateSetter(dispatch, "exportScale"),
      setExportSmoothing: createStateSetter(dispatch, "exportSmoothing"),
      setExportSize: createStateSetter(dispatch, "exportSize"),
      setExportFormat: createStateSetter(dispatch, "exportFormat"),
      setExportJsonMode: createStateSetter(dispatch, "exportJsonMode"),
      setAtlasPackingMode: createStateSetter(dispatch, "atlasPackingMode"),
      setWebpQuality: createStateSetter(dispatch, "webpQuality"),
      setKtx2Quality: createStateSetter(dispatch, "ktx2Quality"),
      setIsSpriteSettingsOpen: createStateSetter(
        dispatch,
        "isSpriteSettingsOpen"
      ),
      setIsAtlasSettingsOpen: createStateSetter(
        dispatch,
        "isAtlasSettingsOpen"
      ),
      setIsExportQualityOpen: createStateSetter(
        dispatch,
        "isExportQualityOpen"
      ),
      setIsSettingsOpen: createStateSetter(dispatch, "isSettingsOpen", silent),
      setSupportLegacyAtlas: createStateSetter(
        dispatch,
        "supportLegacyAtlas",
        silent
      ),
      setHistoryLimit: createStateSetter(dispatch, "historyLimit", silent),
      setHotkeys: createStateSetter(dispatch, "hotkeys", silent),
      setPointGroups: createStateSetter(dispatch, "pointGroups"),
      setSelectedGroupId: createStateSetter(dispatch, "selectedGroupId"),
      setNewGroupName: createStateSetter(dispatch, "newGroupName"),
      setGroupEntrySelection: createStateSetter(dispatch, "groupEntrySelection"),
      setIsGroupPreviewActive: createStateSetter(
        dispatch,
        "isGroupPreviewActive"
      ),
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
      setIsMagnetEnabled: createStateSetter(
        dispatch,
        "isMagnetEnabled",
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
