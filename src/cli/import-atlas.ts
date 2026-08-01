import sharp from "sharp";
import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { normalizeAtlasPayload } from "../lib/atlas-format.ts";
import type { CliAnimation, CliPointGroup } from "./types.ts";
import type { CliFrame, CliFramePoint, ImportedAtlas } from "./frame-types.ts";
import * as math from "./math.ts";

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export const validateAtlasEntry = (
  entry: { x: number; y: number; w: number; h: number; name?: string },
  atlas: { width: number; height: number }
) => {
  const values = [entry.x, entry.y, entry.w, entry.h];
  if (!values.every(Number.isFinite)) {
    return false;
  }
  if (entry.w <= 0 || entry.h <= 0 || entry.x < 0 || entry.y < 0) {
    return false;
  }
  return entry.x + entry.w <= atlas.width && entry.y + entry.h <= atlas.height;
};

export async function loadFramesFromDirectory(dir: string): Promise<CliFrame[]> {
  const inputDir = resolve(dir);
  const files = (await readdir(inputDir)).filter((file) =>
    file.toLowerCase().endsWith(".png")
  );
  files.sort(naturalSort);

  const frames: CliFrame[] = [];
  for (const file of files) {
    const filePath = join(inputDir, file);
    const meta = await sharp(filePath).metadata();
    frames.push({
      name: math.sanitizeFrameName(basename(file, extname(file))),
      width: meta.width || 0,
      height: meta.height || 0,
      path: filePath,
      points: [],
    });
  }
  return frames;
}

type ParsedEntry = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: unknown;
};

function parseEntriesFromParsedJson(parsed: Record<string, unknown>): ParsedEntry[] {
  const meta = (parsed.meta as Record<string, unknown>) ?? {};

  // Raylib schema: rects array
  if (Array.isArray(parsed.rects) && parsed.rects.length > 0) {
    const frameNames = Array.isArray(parsed.frames)
      ? parsed.frames.map((f, i) =>
          typeof f === "string" ? f : (f as { name?: string })?.name || `frame-${i + 1}`
        )
      : [];

    let defaultWidth = 0;
    let defaultHeight = 0;
    if (Array.isArray(meta.frameSize) && meta.frameSize.length >= 2) {
      defaultWidth = Number(meta.frameSize[0]) || 0;
      defaultHeight = Number(meta.frameSize[1]) || 0;
    }

    return (parsed.rects as Array<number[]>)
      .map((rect, index) => {
        if (!Array.isArray(rect) || rect.length < 2) return null;
        const x = Number(rect[0]);
        const y = Number(rect[1]);
        const w = rect.length >= 4 ? Number(rect[2]) : defaultWidth;
        const h = rect.length >= 4 ? Number(rect[3]) : defaultHeight;
        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y) ||
          !Number.isFinite(w) ||
          !Number.isFinite(h) ||
          w <= 0 ||
          h <= 0 ||
          x < 0 ||
          y < 0
        ) {
          return null;
        }
        return {
          name: math.sanitizeFrameName(frameNames[index] || `frame-${index + 1}`),
          x,
          y,
          w,
          h,
        };
      })
      .filter(Boolean) as ParsedEntry[];
  }

  // Standard schema: frames array of objects
  if (Array.isArray(parsed.frames)) {
    return (parsed.frames as Array<Record<string, unknown>>)
      .map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
        const width = Number(entry.w ?? entry.width ?? 0);
        const height = Number(entry.h ?? entry.height ?? 0);
        const x = Number(entry.x ?? 0);
        const y = Number(entry.y ?? 0);
        if (
          !Number.isFinite(width) ||
          !Number.isFinite(height) ||
          !Number.isFinite(x) ||
          !Number.isFinite(y) ||
          width <= 0 ||
          height <= 0 ||
          x < 0 ||
          y < 0
        ) {
          return null;
        }
        return {
          name: math.sanitizeFrameName(
            String(entry.name || entry.filename || entry.id || `frame-${index + 1}`)
          ),
          x,
          y,
          w: width,
          h: height,
          points: entry.points,
        };
      })
      .filter(Boolean) as ParsedEntry[];
  }

  return [];
}

export async function importAtlas(
  atlasPath: string,
  dataPath: string
): Promise<ImportedAtlas> {
  const [pngBuffer, jsonRaw] = await Promise.all([
    readFile(resolve(atlasPath)),
    readFile(resolve(dataPath), "utf-8"),
  ]);
  const atlasMetadata = await sharp(pngBuffer).metadata();
  const atlasSize = {
    width: atlasMetadata.width ?? 0,
    height: atlasMetadata.height ?? 0,
  };
  const parsedRaw = JSON.parse(jsonRaw);
  const parsed = (normalizeAtlasPayload(parsedRaw) ?? {}) as Record<string, unknown>;

  const meta = (parsed.meta as Record<string, unknown>) || {};
  const pivotRaw: string = String(meta.pivot || "top-left");
  const pivotMode =
    pivotRaw === "top-left" || pivotRaw === "bottom-left" || pivotRaw === "center"
      ? pivotRaw
      : "top-left";

  const entries = parseEntriesFromParsedJson(parsed);
  if (entries.length === 0) {
    throw new Error("No valid frame entries found in atlas JSON.");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "nosgen-import-"));

  const frames: CliFrame[] = [];
  const globalNameToId = new Map<string, string>();
  const globalNameToColor = new Map<string, string>();

  // Extract frame slices
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (!validateAtlasEntry(entry, atlasSize)) {
      throw new Error(
        `Invalid atlas frame bounds for ${entry.name}: ${entry.x},${entry.y},${entry.w},${entry.h}`
      );
    }

    const extracted = await sharp(pngBuffer)
      .extract({ left: entry.x, top: entry.y, width: entry.w, height: entry.h })
      .png()
      .toBuffer();

    const tempPath = join(tempDir, `frame_${index}.png`);
    await writeFile(tempPath, extracted);

    const points: CliFramePoint[] = [];
    if (Array.isArray(entry.points)) {
      for (const point of entry.points as Array<Record<string, unknown>>) {
        const name =
          typeof point.name === "string" && point.name.length > 0
            ? point.name
            : `point-${points.length + 1}`;
        const id = globalNameToId.get(name) ?? math.createId();
        globalNameToId.set(name, id);
        const color = globalNameToColor.get(name) ?? math.deterministicColor(name);
        globalNameToColor.set(name, color);
        const pivotPoint = {
          x: Number(point.x ?? 0),
          y: Number(point.y ?? 0),
        };
        const framePoint = math.fromPivotCoords(
          pivotPoint,
          { width: entry.w, height: entry.h },
          pivotMode
        );
        points.push({
          id,
          name,
          x: math.clamp(Math.round(framePoint.x), 0, entry.w),
          y: math.clamp(Math.round(framePoint.y), 0, entry.h),
          color,
          isKeyframe: true,
        });
      }
    }

    frames.push({
      name: entry.name,
      width: entry.w,
      height: entry.h,
      path: tempPath,
      points,
    });
  }

  // Parse points from Raylib object map if present: points: { [name]: [[x,y], ...] }
  const pointsObj =
    parsed.points && typeof parsed.points === "object" && !Array.isArray(parsed.points)
      ? (parsed.points as Record<string, unknown>)
      : null;

  if (pointsObj) {
    Object.entries(pointsObj).forEach(([rawName, rawPoints]) => {
      if (!Array.isArray(rawPoints)) return;
      const name = rawName || "point";
      const id = globalNameToId.get(name) ?? math.createId();
      globalNameToId.set(name, id);
      const color = globalNameToColor.get(name) ?? math.deterministicColor(name);
      globalNameToColor.set(name, color);

      frames.forEach((frame, frameIndex) => {
        const item = rawPoints[frameIndex];
        if (Array.isArray(item) && item.length >= 2) {
          const rawX = Number(item[0]);
          const rawY = Number(item[1]);
          if (Number.isFinite(rawX) && Number.isFinite(rawY)) {
            const framePoint = math.fromPivotCoords(
              { x: rawX, y: rawY },
              { width: frame.width, height: frame.height },
              pivotMode
            );
            frame.points.push({
              id,
              name,
              x: math.clamp(Math.round(framePoint.x), 0, frame.width),
              y: math.clamp(Math.round(framePoint.y), 0, frame.height),
              color,
              isKeyframe: true,
            });
          }
        }
      });
    });
  }

  // Groups: Support 'point_groups' (Raylib) or 'groups' (Standard)
  const rawGroups = (parsed.point_groups ?? parsed.groups) as Record<string, unknown> | undefined;
  let groups: CliPointGroup[] | undefined;
  if (rawGroups && typeof rawGroups === "object") {
    groups = Object.entries(rawGroups).map(([name, rawEntries]) => {
      const entries = Array.isArray(rawEntries) ? (rawEntries as unknown[][]) : [];
      return {
        name,
        entries: entries.map((entry) =>
          (Array.isArray(entry) ? entry : []).filter(
            (pointName): pointName is string => typeof pointName === "string"
          )
        ),
      };
    });
  }

  // Animation: Support 'animations' (Raylib) or 'animation' (Standard)
  const animObj: Record<string, unknown> | undefined =
    parsed.animation && typeof parsed.animation === "object"
      ? (parsed.animation as Record<string, unknown>)
      : parsed.animations && typeof parsed.animations === "object"
        ? (() => {
            const entries = Object.entries(
              parsed.animations as Record<string, Record<string, unknown>>
            );
            return entries.length > 0
              ? ({ name: entries[0][0], ...entries[0][1] } as Record<string, unknown>)
              : undefined;
          })()
        : undefined;


  let animation: CliAnimation | undefined;
  if (animObj) {
    const rawFrames = Array.isArray(animObj.frames) ? animObj.frames : undefined;
    animation = {
      name: typeof animObj.name === "string" ? animObj.name : undefined,
      fps: Number.isFinite(Number(animObj.fps)) ? Number(animObj.fps) : undefined,
      speed: Number.isFinite(Number(animObj.speed)) ? Number(animObj.speed) : undefined,
      loop: typeof animObj.loop === "boolean" ? animObj.loop : undefined,
      frameSelection: rawFrames
        ? rawFrames
            .map((item: unknown) => {
              if (typeof item === "string") return item;
              if (typeof item === "number") return frames[item]?.name;
              return null;
            })
            .filter((val: string | null): val is string => Boolean(val))
        : undefined,
    };
  }


  const originalMode =
    meta.mode === "character" || meta.mode === "animation" || meta.mode === "normal"
      ? (meta.mode as "character" | "animation" | "normal")
      : undefined;

  return { frames, groups, animation, mode: originalMode };
}
