import type { Dispatch, SetStateAction } from "react";
import type {
  AppMode,
  AutoFillShape,
  EditorMode,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
  ThemeMode,
  ViewMode,
} from "@/lib/editor-types";
import { DEFAULT_FPS, DEFAULT_PADDING, DEFAULT_ROWS } from "@/lib/editor-helpers";

export type EditorState = {
  frames: FrameData[];
  currentFrameIndex: number;
  selectedPointId: string | null;
  editorMode: EditorMode;
  pivotMode: PivotMode;
  viewMode: ViewMode;
  appMode: AppMode;
  theme: ThemeMode;
  rows: number;
  padding: number;
  showGrid: boolean;
  showPoints: boolean;
  frameZoom: number;
  panOffset: { x: number; y: number };
  autoFillShape: AutoFillShape;
  spriteDirection: SpriteDirection;
  fps: number;
  speed: number;
  reverse: boolean;
  loop: boolean;
  isPlaying: boolean;
  isKeyframesOpen: boolean;
  exportScale: number;
  exportSmoothing: boolean;
  isSpriteSettingsOpen: boolean;
  isAtlasSettingsOpen: boolean;
  isExportQualityOpen: boolean;
  pointGroups: PointGroup[];
  selectedGroupId: string | null;
  newGroupName: string;
  groupEntrySelection: Record<string, string>;
  isGroupPreviewActive: boolean;
  isGroupPreviewPlaying: boolean;
  groupPreviewIndex: number;
  isPointsOpen: boolean;
  isPointGroupsOpen: boolean;
  isProjectSettingsOpen: boolean;
  projectName: string;
  animationName: string;
  animationFrameSelection: Record<string, boolean>;
};

export type StateUpdater<T> = T | ((prev: T) => T);

export type SetAction<K extends keyof EditorState> = {
  type: "set";
  key: K;
  value: StateUpdater<EditorState[K]>;
};

export type EditorAction =
  | {
      [K in keyof EditorState]: SetAction<K>;
    }[keyof EditorState]
  | { type: "setMany"; values: Partial<EditorState> };

export const createInitialEditorState = (): EditorState => {
  let theme: ThemeMode = "dark";
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("sg-theme");
    if (stored === "light" || stored === "dark") {
      theme = stored;
    }
  }
  return {
    frames: [],
    currentFrameIndex: 0,
    selectedPointId: null,
    editorMode: "select",
    pivotMode: "top-left",
    viewMode: "frame",
    appMode: "character",
    theme,
    rows: DEFAULT_ROWS,
    padding: DEFAULT_PADDING,
    showGrid: true,
    showPoints: true,
    frameZoom: 1,
    panOffset: { x: 0, y: 0 },
    autoFillShape: "ellipse",
    spriteDirection: "clockwise",
    fps: DEFAULT_FPS,
    speed: 1,
    reverse: false,
    loop: true,
    isPlaying: false,
    isKeyframesOpen: true,
    exportScale: 1,
    exportSmoothing: false,
    isSpriteSettingsOpen: true,
    isAtlasSettingsOpen: true,
    isExportQualityOpen: true,
    pointGroups: [],
    selectedGroupId: null,
    newGroupName: "",
    groupEntrySelection: {},
    isGroupPreviewActive: false,
    isGroupPreviewPlaying: false,
    groupPreviewIndex: 0,
    isPointsOpen: true,
    isPointGroupsOpen: true,
    isProjectSettingsOpen: true,
    projectName: "project",
    animationName: "animation",
    animationFrameSelection: {},
  };
};

export const editorReducer = (
  state: EditorState,
  action: EditorAction
): EditorState => {
  switch (action.type) {
    case "set": {
      const key = action.key;
      const currentValue = state[key];
      const value = action.value;
      const nextValue =
        typeof value === "function"
          ? (value as (prev: EditorState[typeof key]) => EditorState[typeof key])(
              currentValue as EditorState[typeof key]
            )
          : (value as EditorState[typeof key]);
      if (Object.is(currentValue, nextValue)) {
        return state;
      }
      return {
        ...state,
        [key]: nextValue,
      };
    }
    case "setMany":
      return { ...state, ...action.values };
    default:
      return state;
  }
};

export const createStateSetter = <K extends keyof EditorState>(
  dispatch: Dispatch<EditorAction>,
  key: K
): Dispatch<SetStateAction<EditorState[K]>> => {
  return (value) => {
    dispatch({ type: "set", key, value });
  };
};
