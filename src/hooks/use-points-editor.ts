import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { FrameData, FramePoint } from "@/lib/editor-types";
import { clamp, createId, createPointColor } from "@/lib/editor-helpers";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type UsePointsEditorParams = {
  frames: FrameData[];
  currentFrame?: FrameData;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  t: Translate;
};

export const usePointsEditor = ({
  frames,
  currentFrame,
  setFrames,
  setSelectedPointId,
  t,
}: UsePointsEditorParams) => {
  const updateCurrentFramePoints = useCallback(
    (updater: (points: FramePoint[]) => FramePoint[]) => {
      if (!currentFrame) {
        return;
      }
      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === currentFrame.id
            ? { ...frame, points: updater(frame.points) }
            : frame
        )
      );
    },
    [currentFrame, setFrames]
  );

  const updateAllFramesPoints = useCallback(
    (updater: (points: FramePoint[]) => FramePoint[]) => {
      setFrames((prev) =>
        prev.map((frame) => ({ ...frame, points: updater(frame.points) }))
      );
    },
    [setFrames]
  );

  const addPointAt = useCallback(
    (x: number, y: number) => {
      if (!currentFrame || frames.length === 0) {
        return;
      }
      const pointId = createId();
      const nextIndex =
        frames.reduce((max, frame) => Math.max(max, frame.points.length), 0) + 1;
      const name = t("point.defaultName", { index: nextIndex });
      const color = createPointColor();
      const ratioX = currentFrame.width ? x / currentFrame.width : 0;
      const ratioY = currentFrame.height ? y / currentFrame.height : 0;

      setFrames((prev) =>
        prev.map((frame) => {
          const isCurrentFrame = frame.id === currentFrame.id;
          const frameX = isCurrentFrame
            ? clamp(Math.round(frame.width * ratioX), 0, frame.width)
            : 0;
          const frameY = isCurrentFrame
            ? clamp(Math.round(frame.height * ratioY), 0, frame.height)
            : 0;
          const point: FramePoint = {
            id: pointId,
            name,
            color,
            x: frameX,
            y: frameY,
            isKeyframe: isCurrentFrame,
          };
          return { ...frame, points: [...frame.points, point] };
        })
      );
      setSelectedPointId(pointId);
    },
    [currentFrame, frames, setFrames, setSelectedPointId, t]
  );

  return {
    updateCurrentFramePoints,
    updateAllFramesPoints,
    addPointAt,
  };
};
