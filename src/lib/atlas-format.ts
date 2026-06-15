// Atlas JSON serialization formats, shared by the web editor and the CLI.
//
// Three on-disk shapes are supported:
//   - "pretty"   : verbose schema, 2-space indented (human friendly, biggest)
//   - "minified" : verbose schema, no whitespace (same shape, ~40-60% smaller)
//   - "compact"  : compact schema, no whitespace (smallest)
//
// The compact schema keeps `meta` readable but collapses the bulky per-frame
// data: frames become positional arrays and repeated point names are stored
// once in a `points` lookup table referenced by index.
//
//   frame  : [name, x, y, w, h]                      (normal / animation)
//   frame  : [name, x, y, w, h, [[nameIdx, px, py]]] (character, with points)
//   points : ["head", "hand_right", ...]             (name table)
//   groups : { "body": [[0, 1], ...] }               (indices into points)
//
// `meta.format === "compact"` marks the compact schema so importers can
// auto-detect it. expandCompactPayload reverses the transform back to the
// verbose schema, so every existing importer keeps working unchanged.
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

type CompactPoint = [number, number, number];
type CompactFrame =
  | [string, number, number, number, number]
  | [string, number, number, number, number, CompactPoint[]];

export type CompactAtlasPayload = {
  meta: AtlasMeta & { format: "compact" };
  points?: string[];
  groups?: Record<string, number[][]>;
  animation?: AtlasAnimation;
  frames: CompactFrame[];
};

export const toCompactPayload = (payload: AtlasPayload): CompactAtlasPayload => {
  // Build the point-name lookup table in first-seen order.
  const names: string[] = [];
  const nameIndex = new Map<string, number>();
  const indexOf = (name: string) => {
    let index = nameIndex.get(name);
    if (index === undefined) {
      index = names.length;
      names.push(name);
      nameIndex.set(name, index);
    }
    return index;
  };

  for (const frame of payload.frames) {
    if (frame.points) {
      for (const point of frame.points) {
        indexOf(point.name);
      }
    }
  }

  const frames: CompactFrame[] = payload.frames.map((frame) => {
    const base: [string, number, number, number, number] = [
      frame.name,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
    ];
    if (frame.points && frame.points.length > 0) {
      const points: CompactPoint[] = frame.points.map((point) => [
        indexOf(point.name),
        point.x,
        point.y,
      ]);
      return [...base, points];
    }
    return base;
  });

  let groups: Record<string, number[][]> | undefined;
  if (payload.groups) {
    groups = Object.entries(payload.groups).reduce<Record<string, number[][]>>(
      (acc, [name, entries]) => {
        acc[name] = entries.map((entry) =>
          entry
            .map((pointName) => nameIndex.get(pointName) ?? -1)
            .filter((index) => index >= 0)
        );
        return acc;
      },
      {}
    );
  }

  return {
    meta: { ...payload.meta, format: "compact" },
    ...(names.length > 0 ? { points: names } : {}),
    ...(groups ? { groups } : {}),
    ...(payload.animation ? { animation: payload.animation } : {}),
    frames,
  };
};

export const expandCompactPayload = (
  compact: CompactAtlasPayload
): AtlasPayload => {
  const table = Array.isArray(compact.points) ? compact.points : [];
  const nameAt = (index: number) => table[index] ?? `point-${index + 1}`;

  const frames: AtlasFrame[] = (compact.frames ?? []).map((entry) => {
    const [name, x, y, w, h, points] = entry;
    const frame: AtlasFrame = {
      name,
      x,
      y,
      w,
      h,
    };
    if (Array.isArray(points)) {
      frame.points = points.map(([index, px, py]) => ({
        name: nameAt(index),
        x: px,
        y: py,
      }));
    }
    return frame;
  });

  let groups: Record<string, string[][]> | undefined;
  if (compact.groups) {
    groups = Object.entries(compact.groups).reduce<Record<string, string[][]>>(
      (acc, [name, entries]) => {
        acc[name] = entries.map((entry) => entry.map((index) => nameAt(index)));
        return acc;
      },
      {}
    );
  }

  // Drop the compact marker so the expanded payload matches the verbose schema.
  const { format: _format, ...meta } = compact.meta;
  void _format;

  return {
    meta,
    ...(groups ? { groups } : {}),
    ...(compact.animation ? { animation: compact.animation } : {}),
    frames,
  };
};

export const isCompactPayload = (parsed: unknown): boolean => {
  if (!parsed || typeof parsed !== "object") {
    return false;
  }
  const payload = parsed as {
    meta?: { format?: unknown };
    frames?: unknown;
  };
  if (payload.meta?.format === "compact") {
    return true;
  }
  // Fall back to structural detection: compact frames are arrays.
  return Array.isArray(payload.frames) && Array.isArray(payload.frames[0]);
};

// Idempotent: compact payloads are expanded to the verbose schema, verbose
// payloads are returned untouched. Run this at the top of every importer.
export const normalizeAtlasPayload = (parsed: unknown): unknown => {
  if (isCompactPayload(parsed)) {
    return expandCompactPayload(parsed as CompactAtlasPayload);
  }
  return parsed;
};

export const serializeAtlasPayload = (
  payload: AtlasPayload,
  mode: ExportJsonMode
): string => {
  if (mode === "compact") {
    return JSON.stringify(toCompactPayload(payload));
  }
  if (mode === "minified") {
    return JSON.stringify(payload);
  }
  return JSON.stringify(payload, null, 2);
};
