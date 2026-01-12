import type {
  Dispatch,
  PointerEvent,
  RefObject,
  SetStateAction,
  WheelEvent,
} from "react";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  AtlasLayout,
  EditorMode,
  FrameData,
  FramePoint,
  KeyframePoint,
  ThemeMode,
  ViewMode,
} from "@/lib/editor-types";
import {
  ArrowLeft,
  ArrowRight,
  FastForward,
  MapPinOff,
  MapPinPlusInside,
  Moon,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type MainStageProps = {
  t: Translate;
  theme: ThemeMode;
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
  currentFrame?: FrameData;
  frames: FrameData[];
  currentFrameIndex: number;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  atlasLayout: AtlasLayout;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  showPoints: boolean;
  setShowPoints: Dispatch<SetStateAction<boolean>>;
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  editorMode: EditorMode;
  handleCanvasPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
  framesInputRef: RefObject<HTMLInputElement | null>;
  selectedPoint: FramePoint | null;
  selectedPointKeyframes: KeyframePoint[];
  fps: number;
  setFps: Dispatch<SetStateAction<number>>;
  speed: number;
  setSpeed: Dispatch<SetStateAction<number>>;
  reverse: boolean;
  setReverse: Dispatch<SetStateAction<boolean>>;
  loop: boolean;
  setLoop: Dispatch<SetStateAction<boolean>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  canAddKeyframe: boolean;
  canRemoveKeyframe: boolean;
  isCurrentFrameKeyframe: boolean;
  updateCurrentFramePoints: (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => void;
  canMoveFrameLeft: boolean;
  canMoveFrameRight: boolean;
  canDeleteFrame: boolean;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  appMode: AppMode;
  animationCurrentSeconds: number;
  animationTotalSeconds: number;
  speedOptions: number[];
  toNumber: (value: string, fallback: number) => number;
};

export function MainStage({
  t,
  theme,
  setTheme,
  currentFrame,
  frames,
  currentFrameIndex,
  setCurrentFrameIndex,
  atlasLayout,
  viewMode,
  setViewMode,
  showGrid,
  setShowGrid,
  showPoints,
  setShowPoints,
  stageRef,
  canvasRef,
  editorMode,
  handleCanvasPointerDown,
  handleCanvasPointerMove,
  handleCanvasPointerUp,
  handleCanvasWheel,
  framesInputRef,
  selectedPoint,
  selectedPointKeyframes,
  fps,
  setFps,
  speed,
  setSpeed,
  reverse,
  setReverse,
  loop,
  setLoop,
  isPlaying,
  setIsPlaying,
  setSelectedPointId,
  canAddKeyframe,
  canRemoveKeyframe,
  isCurrentFrameKeyframe,
  updateCurrentFramePoints,
  canMoveFrameLeft,
  canMoveFrameRight,
  canDeleteFrame,
  setFrames,
  appMode,
  animationCurrentSeconds,
  animationTotalSeconds,
  speedOptions,
  toNumber,
}: MainStageProps) {
  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-card/70 p-4">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              {t("app.kicker")}
            </div>
            <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {currentFrame
                ? t("status.frameSize", {
                    w: currentFrame.width,
                    h: currentFrame.height,
                  })
                : t("status.noFrame")}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {t("status.atlasSize", {
                w: atlasLayout.width,
                h: atlasLayout.height,
              })}
            </Badge>
            <Badge variant="secondary">
              {t("status.rows", { rows: atlasLayout.rows })}
            </Badge>
            <Badge variant="secondary">
              {t("status.columns", { columns: atlasLayout.columns })}
            </Badge>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeMode)}
              >
                <SelectTrigger
                  className="h-8 w-[110px] border-0 bg-transparent px-0 text-xs shadow-none ring-0 ring-offset-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label={t("label.theme")}
                >
                  <SelectValue placeholder={t("label.theme")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t("theme.dark")}</SelectItem>
                  <SelectItem value="light">{t("theme.light")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="frame">{t("tab.frame")}</TabsTrigger>
              <TabsTrigger value="atlas">{t("tab.atlas")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="grid-toggle"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <Label htmlFor="grid-toggle">{t("label.grid")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="points-toggle"
                checked={showPoints}
                onCheckedChange={setShowPoints}
              />
              <Label htmlFor="points-toggle">{t("label.pointsToggle")}</Label>
            </div>
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative mt-4 flex-1 min-h-0 max-h-[58vh] overflow-hidden rounded-2xl border border-border/60 bg-background/70"
        >
          <canvas
            ref={canvasRef}
            className={cn(
              "h-full w-full touch-none",
              editorMode === "add" ? "cursor-crosshair" : "cursor-default"
            )}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            onWheel={handleCanvasWheel}
          />

          {frames.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <button
                type="button"
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/60 transition hover:bg-muted/80"
                onClick={() => framesInputRef.current?.click()}
                aria-label={t("label.pngFrames")}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
              </button>
              <p className="text-sm font-medium">{t("hint.noFramesTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("hint.noFramesBody")}</p>
            </div>
          )}

          {frames.length > 0 && editorMode === "add" && viewMode === "frame" && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
              {t("status.addMode")}
            </div>
          )}
        </div>

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
                {animationCurrentSeconds.toFixed(2)}s /{" "}
                {animationTotalSeconds.toFixed(2)}s
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
