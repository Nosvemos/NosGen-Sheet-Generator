// Atlas JSON serialization formats, shared by the web editor and the CLI.
//
// Supported JSON output schemas:
//   - "pretty" : Standard verbose JSON schema with 2-space indentation
//   - "raylib" : Raylib & C/C++ engine optimized JSON schema
import type { ExportJsonMode } from "./editor-types";

export type AtlasPoint = { name: string; x: number; y: number };

export type AtlasFrame = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: AtlasPoint[];
};

export type AtlasMeta = {
  app?: string;
  format?: string;
  image?: string;
  size?: { w: number; h: number };
  rows?: number;
  columns?: number;
  padding?: number;
  scale?: number;
  pivot?: string;
  rotation?: string;
  spriteDirection?: string;
  mode?: string;
  [key: string]: unknown;
};

export type AtlasAnimation = {
  name?: string;
  fps?: number;
  speed?: number;
  loop?: boolean;
  frames?: string[];
  [key: string]: unknown;
};

export type AtlasPayload = {
  meta: AtlasMeta;
  groups?: Record<string, string[][]>;
  animation?: AtlasAnimation;
  frames: AtlasFrame[];
};

export const normalizeAtlasPayload = (parsed: unknown): unknown => {
  return parsed;
};

export const formatRaylibJson = (payload: unknown): string => {
  let json = JSON.stringify(payload, null, 2);

  // Collapse 1D number arrays: [\n 0,\n 0\n] -> [0, 0]
  json = json.replace(/\[\s*([\d\s.,-]+?)\s*\]/g, (match: string, p1: string) => {
    if (/^[\d\s.,-]+$/.test(p1) && !p1.includes("[")) {
      const items = p1
        .trim()
        .split(/\s*,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      return `[${items.join(", ")}]`;
    }
    return match;
  });

  // Collapse 2D number tuple arrays: [\n [0, 0],\n [356, 0]\n] -> [[0, 0], [356, 0]]
  json = json.replace(
    /\[\s*(\[\s*[\d\s.,-]+\s*\](?:\s*,\s*\[\s*[\d\s.,-]+\s*\])*)\s*\]/g,
    (_match: string, p1: string) => {
      const tuples = p1.split(/\s*,\s*(?=\[)/).map((s) => s.trim());
      return `[${tuples.join(", ")}]`;
    }
  );

  return json;
};

export const serializeAtlasPayload = (
  payload: unknown,
  mode: ExportJsonMode = "pretty"
): string => {
  if (mode === "raylib") {
    return formatRaylibJson(payload);
  }
  return JSON.stringify(payload, null, 2);
};
