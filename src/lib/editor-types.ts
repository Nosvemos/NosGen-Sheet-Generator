export type PivotMode = "top-left" | "bottom-left" | "center";
export type EditorMode = "select" | "add";
export type ViewMode = "frame" | "atlas";
export type ThemeMode = "dark" | "light";
export type AppMode = "character" | "animation" | "normal";

export type FramePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isKeyframe?: boolean;
};

export type PointGroup = {
  id: string;
  name: string;
  entries: string[][];
};

export type FrameData = {
  id: string;
  name: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  points: FramePoint[];
};

export type AtlasLayout = {
  rows: number;
  columns: number;
  padding: number;
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  positions: { x: number; y: number; w: number; h: number }[];
};

export type StageTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  frameWidth: number;
  frameHeight: number;
  viewWidth: number;
  viewHeight: number;
};

export type KeyframePoint = {
  frameIndex: number;
  x: number;
  y: number;
};

export type AutoFillShape =
  | "ellipse"
  | "circle"
  | "square"
  | "tangent"
  | "linear";
export type SpriteDirection = "clockwise" | "counterclockwise";

export type AutoFillModel =
  | {
      shape: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      phase: number;
      rotation: number;
    }
  | {
      shape: "circle";
      cx: number;
      cy: number;
      r: number;
      phase: number;
    }
  | {
      shape: "square";
      cx: number;
      cy: number;
      size: number;
      phase: number;
    }
  | {
      shape: "linear";
      points: KeyframePoint[];
    }
  | {
      shape: "tangent";
      points: KeyframePoint[];
    };
