import { useCallback } from "react";
import type { FrameData, StageTransform } from "@/lib/editor-types";

type UseFrameTransformParams = {
  currentFrame?: FrameData;
  frameZoom: number;
  panOffset: { x: number; y: number };
};

export const useFrameTransform = ({
  currentFrame,
  frameZoom,
  panOffset,
}: UseFrameTransformParams) => {
  return useCallback(
    (viewWidth: number, viewHeight: number): StageTransform | null => {
      if (!currentFrame) {
        return null;
      }
      const margin = 32;
      const safeWidth = Math.max(1, viewWidth - margin * 2);
      const safeHeight = Math.max(1, viewHeight - margin * 2);
      const baseScale = Math.min(
        safeWidth / currentFrame.width,
        safeHeight / currentFrame.height
      );
      const scale = baseScale * frameZoom;
      const drawWidth = currentFrame.width * scale;
      const drawHeight = currentFrame.height * scale;
      const offsetX = (viewWidth - drawWidth) / 2 + panOffset.x;
      const offsetY = (viewHeight - drawHeight) / 2 + panOffset.y;
      return {
        scale,
        offsetX,
        offsetY,
        frameWidth: currentFrame.width,
        frameHeight: currentFrame.height,
        viewWidth,
        viewHeight,
      };
    },
    [currentFrame, frameZoom, panOffset]
  );
};
