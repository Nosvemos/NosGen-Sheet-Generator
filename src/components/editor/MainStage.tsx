import type {
  Dispatch,
  PointerEvent,
  RefObject,
  SetStateAction,
  WheelEvent,
} from "react";
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
import type { Locale } from "@/lib/i18n";
import type { HotkeyMap } from "@/lib/hotkeys";
import { MainStageHeader } from "@/components/editor/main-stage/MainStageHeader";
import { PlaybackPanel } from "@/components/editor/main-stage/PlaybackPanel";
import { StageCanvas } from "@/components/editor/main-stage/StageCanvas";
import { StageToolbar } from "@/components/editor/main-stage/StageToolbar";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export type MainStageProps = {
  t: Translate;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
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
  isMagnetEnabled: boolean;
  setIsMagnetEnabled: Dispatch<SetStateAction<boolean>>;
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  editorMode: EditorMode;
  handleCanvasPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void;
  handleCanvasWheel: (event: WheelEvent<HTMLCanvasElement>) => void;
  handleDroppedFiles: (files: File[] | FileList) => Promise<void> | void;
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
  updateCurrentFramePoints: (updater: (points: FramePoint[]) => FramePoint[]) => void;
  canMoveFrameLeft: boolean;
  canMoveFrameRight: boolean;
  canDeleteFrame: boolean;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  appMode: AppMode;
  animationCurrentSeconds: number;
  animationTotalSeconds: number;
  speedOptions: number[];
  toNumber: (value: string, fallback: number) => number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hotkeys: HotkeyMap;
};

export function MainStage({
  t,
  locale,
  setLocale,
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
  isMagnetEnabled,
  setIsMagnetEnabled,
  stageRef,
  canvasRef,
  editorMode,
  handleCanvasPointerDown,
  handleCanvasPointerMove,
  handleCanvasPointerUp,
  handleCanvasWheel,
  handleDroppedFiles,
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hotkeys,
}: MainStageProps) {
  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-card/70 p-4">
      <MainStageHeader
        t={t}
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
        currentFrame={currentFrame}
        atlasLayout={atlasLayout}
      />

      <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur">
        <StageToolbar
          t={t}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showPoints={showPoints}
          setShowPoints={setShowPoints}
          isMagnetEnabled={isMagnetEnabled}
          setIsMagnetEnabled={setIsMagnetEnabled}
          hotkeys={hotkeys}
        />

        <StageCanvas
          t={t}
          stageRef={stageRef}
          canvasRef={canvasRef}
          editorMode={editorMode}
          viewMode={viewMode}
          framesLength={frames.length}
          handleCanvasPointerDown={handleCanvasPointerDown}
          handleCanvasPointerMove={handleCanvasPointerMove}
          handleCanvasPointerUp={handleCanvasPointerUp}
          handleCanvasWheel={handleCanvasWheel}
          handleDroppedFiles={handleDroppedFiles}
          framesInputRef={framesInputRef}
        />

        <PlaybackPanel
          t={t}
          frames={frames}
          currentFrame={currentFrame}
          currentFrameIndex={currentFrameIndex}
          setCurrentFrameIndex={setCurrentFrameIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          selectedPoint={selectedPoint}
          selectedPointKeyframes={selectedPointKeyframes}
          updateCurrentFramePoints={updateCurrentFramePoints}
          canAddKeyframe={canAddKeyframe}
          canRemoveKeyframe={canRemoveKeyframe}
          isCurrentFrameKeyframe={isCurrentFrameKeyframe}
          canMoveFrameLeft={canMoveFrameLeft}
          canMoveFrameRight={canMoveFrameRight}
          canDeleteFrame={canDeleteFrame}
          setFrames={setFrames}
          setSelectedPointId={setSelectedPointId}
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
          appMode={appMode}
          animationCurrentSeconds={animationCurrentSeconds}
          animationTotalSeconds={animationTotalSeconds}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          hotkeys={hotkeys}
        />
      </section>
    </main>
  );
}
