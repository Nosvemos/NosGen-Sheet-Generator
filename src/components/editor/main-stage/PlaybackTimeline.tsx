import { Slider } from "@/components/ui/slider";
import type { PlaybackPanelProps } from "./playback-panel-types";

type PlaybackTimelineProps = Pick<
  PlaybackPanelProps,
  | "t"
  | "frames"
  | "currentFrameIndex"
  | "setCurrentFrameIndex"
  | "selectedPoint"
  | "selectedPointKeyframes"
  | "appMode"
  | "animationCurrentSeconds"
  | "animationTotalSeconds"
>;

export function PlaybackTimeline({
  t,
  frames,
  currentFrameIndex,
  setCurrentFrameIndex,
  selectedPoint,
  selectedPointKeyframes,
  appMode,
  animationCurrentSeconds,
  animationTotalSeconds,
}: PlaybackTimelineProps) {
  return (
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
  );
}
