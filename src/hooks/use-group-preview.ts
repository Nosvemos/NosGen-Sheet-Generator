import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PointGroup } from "@/lib/editor-types";

type UseGroupPreviewParams = {
  selectedGroup: PointGroup | null;
  isGroupPreviewPlaying: boolean;
  setIsGroupPreviewPlaying: Dispatch<SetStateAction<boolean>>;
  setGroupPreviewIndex: Dispatch<SetStateAction<number>>;
  fps: number;
  speed: number;
};

export const useGroupPreview = ({
  selectedGroup,
  isGroupPreviewPlaying,
  setIsGroupPreviewPlaying,
  setGroupPreviewIndex,
  fps,
  speed,
}: UseGroupPreviewParams) => {
  useEffect(() => {
    if (!selectedGroup || selectedGroup.entries.length === 0) {
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
      return;
    }
    setGroupPreviewIndex((prev) =>
      Math.max(0, Math.min(prev, selectedGroup.entries.length - 1))
    );
  }, [selectedGroup, setIsGroupPreviewPlaying, setGroupPreviewIndex]);

  useEffect(() => {
    if (
      !isGroupPreviewPlaying ||
      !selectedGroup ||
      selectedGroup.entries.length === 0
    ) {
      return;
    }
    const safeFps = Math.max(1, fps);
    const intervalMs = 1000 / (safeFps * speed);
    const timer = window.setInterval(() => {
      setGroupPreviewIndex((prev) =>
        selectedGroup.entries.length === 0
          ? 0
          : (prev + 1) % selectedGroup.entries.length
      );
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    isGroupPreviewPlaying,
    selectedGroup?.id,
    selectedGroup?.entries.length,
    fps,
    speed,
    setGroupPreviewIndex,
  ]);
};
