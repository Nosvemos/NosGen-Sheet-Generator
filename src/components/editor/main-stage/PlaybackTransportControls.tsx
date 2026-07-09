import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlaybackPanelProps } from "./playback-panel-types";
import {
  FastForward,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";

type PlaybackTransportControlsProps = Pick<
  PlaybackPanelProps,
  | "t"
  | "frames"
  | "setCurrentFrameIndex"
  | "isPlaying"
  | "setIsPlaying"
  | "canUndo"
  | "canRedo"
  | "onUndo"
  | "onRedo"
  | "hotkeys"
>;

export function PlaybackTransportControls({
  t,
  frames,
  setCurrentFrameIndex,
  isPlaying,
  setIsPlaying,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hotkeys,
}: PlaybackTransportControlsProps) {
  const withKey = (label: string, key: string) => `${label} · ${key}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setCurrentFrameIndex(0)}
              disabled={frames.length === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {withKey(t("action.first"), hotkeys.firstFrame)}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() =>
                setCurrentFrameIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={frames.length === 0}
            >
              <Rewind className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {withKey(t("action.previous"), hotkeys.prevFrame)}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsPlaying((prev) => !prev)}
          disabled={frames.length === 0}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() =>
                setCurrentFrameIndex((prev) =>
                  Math.min(frames.length - 1, prev + 1)
                )
              }
              disabled={frames.length === 0}
            >
              <FastForward className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {withKey(t("action.next"), hotkeys.nextFrame)}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() =>
                setCurrentFrameIndex(Math.max(0, frames.length - 1))
              }
              disabled={frames.length === 0}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {withKey(t("action.last"), hotkeys.lastFrame)}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{withKey(t("action.undo"), hotkeys.undo)}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{withKey(t("action.redo"), hotkeys.redo)}</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
