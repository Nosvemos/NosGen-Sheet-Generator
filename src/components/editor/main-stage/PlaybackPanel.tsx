import { PlaybackFrameActions } from "./PlaybackFrameActions";
import { PlaybackSettingsControls } from "./PlaybackSettingsControls";
import { PlaybackTimeline } from "./PlaybackTimeline";
import { PlaybackTransportControls } from "./PlaybackTransportControls";
import type { PlaybackPanelProps } from "./playback-panel-types";

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
  hotkeys,
}: PlaybackPanelProps) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlaybackTransportControls
          t={t}
          frames={frames}
          setCurrentFrameIndex={setCurrentFrameIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          hotkeys={hotkeys}
        />
        <PlaybackFrameActions
          t={t}
          frames={frames}
          currentFrame={currentFrame}
          currentFrameIndex={currentFrameIndex}
          setCurrentFrameIndex={setCurrentFrameIndex}
          setIsPlaying={setIsPlaying}
          selectedPoint={selectedPoint}
          updateCurrentFramePoints={updateCurrentFramePoints}
          canAddKeyframe={canAddKeyframe}
          canRemoveKeyframe={canRemoveKeyframe}
          isCurrentFrameKeyframe={isCurrentFrameKeyframe}
          canMoveFrameLeft={canMoveFrameLeft}
          canMoveFrameRight={canMoveFrameRight}
          canDeleteFrame={canDeleteFrame}
          setFrames={setFrames}
          setSelectedPointId={setSelectedPointId}
        />
        <PlaybackSettingsControls
          t={t}
          reverse={reverse}
          setReverse={setReverse}
          loop={loop}
          setLoop={setLoop}
          fps={fps}
          setFps={setFps}
          speed={speed}
          setSpeed={setSpeed}
          speedOptions={speedOptions}
          toNumber={toNumber}
        />
      </div>

      <PlaybackTimeline
        t={t}
        frames={frames}
        currentFrameIndex={currentFrameIndex}
        setCurrentFrameIndex={setCurrentFrameIndex}
        selectedPoint={selectedPoint}
        selectedPointKeyframes={selectedPointKeyframes}
        appMode={appMode}
        animationCurrentSeconds={animationCurrentSeconds}
        animationTotalSeconds={animationTotalSeconds}
      />
    </div>
  );
}
