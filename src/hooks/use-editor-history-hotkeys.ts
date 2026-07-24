import { useMemo, type Dispatch } from "react";
import type {
  EditorHistory,
  EditorHistoryAction,
} from "@/lib/editor-reducer";
import type { AppMode, FrameData, FramePoint } from "@/lib/editor-types";
import type { useEditorStateSetters } from "@/hooks/use-editor-state-setters";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { DEFAULT_HOTKEYS, type HotkeyMap } from "@/lib/hotkeys";

type EditorStateSetters = ReturnType<typeof useEditorStateSetters>;

type UseEditorHistoryHotkeysParams = {
  history: EditorHistory;
  dispatch: Dispatch<EditorHistoryAction>;
  hotkeys: HotkeyMap;
  frames: FrameData[];
  currentFrame?: FrameData;
  currentPoints: FramePoint[];
  selectedPointId: string | null;
  appMode: AppMode;
  addPointAt: (x: number, y: number) => void;
  updateAllFramesPoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  setters: Pick<
    EditorStateSetters,
    | "setCurrentFrameIndex"
    | "setIsPlaying"
    | "setShowGrid"
    | "setShowPoints"
    | "setEditorMode"
    | "setSelectedPointId"
    | "setHotkeys"
  >;
};

export const useEditorHistoryHotkeys = ({
  history,
  dispatch,
  hotkeys,
  frames,
  currentFrame,
  currentPoints,
  selectedPointId,
  appMode,
  addPointAt,
  updateAllFramesPoints,
  setters,
}: UseEditorHistoryHotkeysParams) => {
  const {
    setCurrentFrameIndex,
    setIsPlaying,
    setShowGrid,
    setShowPoints,
    setEditorMode,
    setSelectedPointId,
    setHotkeys,
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
        if (!currentFrame || appMode !== "ship") {
          return;
        }
        addPointAt(currentFrame.width / 2, currentFrame.height / 2);
      },
      deletePoint: () => {
        if (!selectedPointId || appMode !== "ship") {
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
          currentIndex >= 0 ? (currentIndex + 1) % currentPoints.length : 0;
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
            ? (currentIndex - 1 + currentPoints.length) % currentPoints.length
            : currentPoints.length - 1;
        setSelectedPointId(currentPoints[nextIndex].id);
      },
    },
  });

  return {
    canUndo,
    canRedo,
    historyEntries,
    undoCount,
    redoCount,
    handleUndo,
    handleRedo,
    handleResetHotkeys,
    handleClearHistory,
  };
};
