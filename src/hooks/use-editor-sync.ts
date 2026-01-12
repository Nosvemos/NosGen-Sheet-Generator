import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FrameData, ThemeMode } from "@/lib/editor-types";

type UseEditorSyncParams = {
  theme: ThemeMode;
  frames: FrameData[];
  currentFrameIndex: number;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  selectedPointId: string | null;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  currentFrame?: FrameData;
  setAnimationFrameSelection: Dispatch<
    SetStateAction<Record<string, boolean>>
  >;
};

export const useEditorSync = ({
  theme,
  frames,
  currentFrameIndex,
  setCurrentFrameIndex,
  selectedPointId,
  setSelectedPointId,
  setIsPlaying,
  currentFrame,
  setAnimationFrameSelection,
}: UseEditorSyncParams) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("sg-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (frames.length === 0) {
      setCurrentFrameIndex(0);
      setSelectedPointId(null);
      setIsPlaying(false);
      return;
    }
    if (currentFrameIndex > frames.length - 1) {
      setCurrentFrameIndex(frames.length - 1);
    }
  }, [
    frames.length,
    currentFrameIndex,
    setCurrentFrameIndex,
    setSelectedPointId,
    setIsPlaying,
  ]);

  useEffect(() => {
    if (!currentFrame) {
      setSelectedPointId(null);
      return;
    }
    if (
      selectedPointId &&
      !currentFrame.points.some((point) => point.id === selectedPointId)
    ) {
      setSelectedPointId(null);
    }
  }, [currentFrame, selectedPointId, setSelectedPointId]);

  useEffect(() => {
    setAnimationFrameSelection((prev) => {
      const next: Record<string, boolean> = {};
      frames.forEach((frame) => {
        next[frame.id] = prev[frame.id] ?? true;
      });
      return next;
    });
  }, [frames, setAnimationFrameSelection]);
};
