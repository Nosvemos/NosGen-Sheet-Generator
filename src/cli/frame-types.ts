import type { SizedItem } from "../lib/atlas-layout.ts";
import type { CliAnimation, CliPointGroup } from "./types.ts";

export type CliFramePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isKeyframe?: boolean;
};

export type CliFrame = SizedItem & {
  name: string;
  path: string;
  points: CliFramePoint[];
};

export type ImportedAtlas = {
  frames: CliFrame[];
  groups?: CliPointGroup[];
  animation?: CliAnimation;
  mode?: "normal" | "character" | "animation";
  jsonMode?: "pretty" | "raylib";
};
