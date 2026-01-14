import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TranslationKey } from "@/lib/i18n";
import type { AppMode, FrameData, FramePoint, KeyframePoint } from "@/lib/editor-types";
import {
  ArrowLeft,
  ArrowRight,
  FastForward,
  MapPinOff,
  MapPinPlusInside,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type PlaybackPanelProps = {
  t: Translate;
  frames: FrameData[];
  currentFrame?: FrameData;
  currentFrameIndex: number;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  selectedPoint: FramePoint | null;
  selectedPointKeyframes: KeyframePoint[];
  updateCurrentFramePoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  canAddKeyframe: boolean;
  canRemoveKeyframe: boolean;
  isCurrentFrameKeyframe: boolean;
  canMoveFrameLeft: boolean;
  canMoveFrameRight: boolean;
  canDeleteFrame: boolean;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  reverse: boolean;
  setReverse: Dispatch<SetStateAction<boolean>>;
  loop: boolean;
  setLoop: Dispatch<SetStateAction<boolean>>;
  fps: number;
  setFps: Dispatch<SetStateAction<number>>;
  speed: number;
  setSpeed: Dispatch<SetStateAction<number>>;
  speedOptions: number[];
  toNumber: (value: string, fallback: number) => number;
  appMode: AppMode;
  animationCurrentSeconds: number;
  animationTotalSeconds: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function PlaybackPanel({
  t,
  frames,
  currentFrame,
  currentFrameIndex,
  setCurrentFrameIndex,
  isPlaying,
  setIsPlaying,
  selectedPoint,
  selectedPointKeyframes,
  updateCurrentFramePoints,
  canAddKeyframe,
  canRemoveKeyframe,
  isCurrentFrameKeyframe,
  canMoveFrameLeft,
  canMoveFrameRight,
  canDeleteFrame,
  setFrames,
  setSelectedPointId,
  reverse,
  setReverse,
  loop,
  setLoop,
  fps,
  setFps,
  speed,
  setSpeed,
  speedOptions,
  toNumber,
  appMode,
  animationCurrentSeconds,
  animationTotalSeconds,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: PlaybackPanelProps) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            <TooltipContent>{t("action.first")}</TooltipContent>
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
            <TooltipContent>{t("action.previous")}</TooltipContent>
          </Tooltip>
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={frames.length === 0}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
            <TooltipContent>{t("action.next")}</TooltipContent>
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
            <TooltipContent>{t("action.last")}</TooltipContent>
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
            <TooltipContent>{t("action.undo")}</TooltipContent>
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
            <TooltipContent>{t("action.redo")}</TooltipContent>
          </Tooltip>
        </div>
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="reverse-toggle"
              checked={reverse}
              onCheckedChange={setReverse}
            />
            <Label htmlFor="reverse-toggle">{t("label.reverse")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="loop-toggle" checked={loop} onCheckedChange={setLoop} />
            <Label htmlFor="loop-toggle">{t("label.loop")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="fps-input">{t("label.fps")}</Label>
            <Input
              id="fps-input"
              type="number"
              className="w-20"
              value={String(fps)}
              onChange={(event) =>
                setFps(Math.max(1, toNumber(event.target.value, fps)))
              }
              min={1}
            />
          </div>
          <Select
            value={String(speed)}
            onValueChange={(value) => setSpeed(Number(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder={t("label.speed")} />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs font-mono text-muted-foreground">
          {t("status.frameCounter", {
            current: frames.length ? currentFrameIndex + 1 : 0,
            total: frames.length,
          })}
        </div>
        <div className="relative flex-1">
          <Slider
            className="w-full"
            min={0}
            max={Math.max(0, frames.length - 1)}
            step={1}
            value={[currentFrameIndex]}
            onValueChange={(value) => setCurrentFrameIndex(value[0] ?? 0)}
            disabled={frames.length === 0}
          />
          {selectedPoint &&
            selectedPointKeyframes.length > 0 &&
            frames.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {selectedPointKeyframes.map((keyframe) => {
                  const span = Math.max(1, frames.length - 1);
                  const ratio = keyframe.frameIndex / span;
                  return (
                    <span
                      key={`${selectedPoint.id}-${keyframe.frameIndex}`}
                      className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border border-background/80"
                      style={{
                        left: `${ratio * 100}%`,
                        backgroundColor:
                          selectedPoint.color || "rgba(120,120,120,0.9)",
                      }}
                    />
                  );
                })}
              </div>
            )}
        </div>
        {appMode === "animation" && (
          <div className="text-xs font-mono text-muted-foreground">
            {animationCurrentSeconds.toFixed(2)}s / {" "}
            {animationTotalSeconds.toFixed(2)}s
          </div>
        )}
      </div>
    </div>
  );
}
