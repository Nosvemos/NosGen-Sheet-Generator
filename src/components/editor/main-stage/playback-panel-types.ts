import type { Dispatch, SetStateAction } from "react";
import type {
  AppMode,
  FrameData,
  FramePoint,
  KeyframePoint,
} from "@/lib/editor-types";
import type { TranslationKey } from "@/lib/i18n";
import type { HotkeyMap } from "@/lib/hotkeys";

export type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export type PlaybackPanelProps = {
  t: Translate;
  frames: FrameData[];
  currentFrame?: FrameData;
  currentFrameIndex: number;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  selectedPoint: FramePoint | null;
  selectedPointKeyframes: KeyframePoint[];
  updateCurrentFramePoints: (
    updater: (points: FramePoint[]) => FramePoint[]
  ) => void;
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
  hotkeys: HotkeyMap;
};
