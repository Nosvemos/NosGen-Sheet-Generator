import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlaybackPanelProps } from "./playback-panel-types";
import {
  ArrowLeft,
  ArrowRight,
  MapPinOff,
  MapPinPlusInside,
  Trash2,
} from "lucide-react";

type PlaybackFrameActionsProps = Pick<
  PlaybackPanelProps,
  | "t"
  | "frames"
  | "currentFrame"
  | "currentFrameIndex"
  | "setCurrentFrameIndex"
  | "setIsPlaying"
  | "selectedPoint"
  | "updateCurrentFramePoints"
  | "canAddKeyframe"
  | "canRemoveKeyframe"
  | "isCurrentFrameKeyframe"
  | "canMoveFrameLeft"
  | "canMoveFrameRight"
  | "canDeleteFrame"
  | "setFrames"
  | "setSelectedPointId"
>;

export function PlaybackFrameActions({
  t,
  frames,
  currentFrame,
  currentFrameIndex,
  setCurrentFrameIndex,
  setIsPlaying,
  selectedPoint,
  updateCurrentFramePoints,
  canAddKeyframe,
  canRemoveKeyframe,
  isCurrentFrameKeyframe,
  canMoveFrameLeft,
  canMoveFrameRight,
  canDeleteFrame,
  setFrames,
  setSelectedPointId,
}: PlaybackFrameActionsProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!selectedPoint || !currentFrame) {
                  return;
                }
                updateCurrentFramePoints((points) =>
                  points.map((point) =>
                    point.id === selectedPoint.id
                      ? { ...point, isKeyframe: true }
                      : point
                  )
                );
              }}
              disabled={!canAddKeyframe || isCurrentFrameKeyframe}
            >
              <MapPinPlusInside className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("action.addKeyframe")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!selectedPoint || !currentFrame) {
                  return;
                }
                updateCurrentFramePoints((points) =>
                  points.map((point) =>
                    point.id === selectedPoint.id
                      ? { ...point, isKeyframe: false }
                      : point
                  )
                );
              }}
              disabled={!canRemoveKeyframe}
            >
              <MapPinOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("action.removeKeyframeHere")}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!canMoveFrameLeft) {
                  return;
                }
                setFrames((prev) => {
                  const next = [...prev];
                  const targetIndex = Math.max(0, currentFrameIndex - 1);
                  if (targetIndex === currentFrameIndex) {
                    return prev;
                  }
                  [next[currentFrameIndex], next[targetIndex]] = [
                    next[targetIndex],
                    next[currentFrameIndex],
                  ];
                  return next;
                });
                setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={!canMoveFrameLeft}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("action.moveFrameLeft")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!canDeleteFrame) {
                  return;
                }
                if (
                  typeof window !== "undefined" &&
                  !window.confirm(t("confirm.deleteFrame"))
                ) {
                  return;
                }
                setFrames((prev) => {
                  if (prev.length === 0) {
                    return prev;
                  }
                  const next = prev.filter(
                    (_, index) => index !== currentFrameIndex
                  );
                  const nextIndex = Math.min(
                    currentFrameIndex,
                    Math.max(0, next.length - 1)
                  );
                  setCurrentFrameIndex(nextIndex);
                  if (next.length === 0) {
                    setSelectedPointId(null);
                    setIsPlaying(false);
                  }
                  return next;
                });
              }}
              disabled={!canDeleteFrame}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("action.deleteFrame")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                if (!canMoveFrameRight) {
                  return;
                }
                setFrames((prev) => {
                  const next = [...prev];
                  const targetIndex = Math.min(
                    prev.length - 1,
                    currentFrameIndex + 1
                  );
                  if (targetIndex === currentFrameIndex) {
                    return prev;
                  }
                  [next[currentFrameIndex], next[targetIndex]] = [
                    next[targetIndex],
                    next[currentFrameIndex],
                  ];
                  return next;
                });
                setCurrentFrameIndex((prev) =>
                  Math.min(frames.length - 1, prev + 1)
                );
              }}
              disabled={!canMoveFrameRight}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("action.moveFrameRight")}</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
