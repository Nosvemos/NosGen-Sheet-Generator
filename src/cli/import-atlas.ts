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
      name: basename(file, extname(file)),
      width: meta.width || 0,
      height: meta.height || 0,
      path: filePath,
      points: [],
    });
  }
  return frames;
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
  const parsed = normalizeAtlasPayload(parsedRaw) as typeof parsedRaw;

  const meta = parsed.meta || {};
  const pivotRaw: string = meta.pivot || "top-left";
  const pivotMode =
    pivotRaw === "top-left" || pivotRaw === "bottom-left" || pivotRaw === "center"
      ? pivotRaw
      : "top-left";

  const framesData = Array.isArray(parsed.frames) ? parsed.frames : [];
  const tempDir = await mkdtemp(join(tmpdir(), "nosgen-import-"));

  const frames: CliFrame[] = [];
  const globalNameToId = new Map<string, string>();
  const globalNameToColor = new Map<string, string>();

  for (let index = 0; index < framesData.length; index++) {
    const entry = framesData[index];
    const w = Number(entry.w ?? entry.width ?? 0);
    const h = Number(entry.h ?? entry.height ?? 0);
    const x = Number(entry.x ?? 0);
    const y = Number(entry.y ?? 0);
    const atlasEntry = {
      name: entry.name || `frame-${index + 1}`,
      x,
      y,
      w,
      h,
    };
    if (!validateAtlasEntry(atlasEntry, atlasSize)) {
      throw new Error(
        `Invalid atlas frame bounds for ${atlasEntry.name}: ${x},${y},${w},${h}`
      );
    }

    const extracted = await sharp(pngBuffer)
      .extract({ left: x, top: y, width: w, height: h })
      .png()
      .toBuffer();

    const tempPath = join(tempDir, `frame_${index}.png`);
    await writeFile(tempPath, extracted);

    const points: CliFramePoint[] = [];
    if (Array.isArray(entry.points)) {
      for (const point of entry.points) {
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
        const framePoint = math.fromPivotCoords(pivotPoint, { width: w, height: h }, pivotMode);
        points.push({
          id,
          name,
          x: math.clamp(Math.round(framePoint.x), 0, w),
          y: math.clamp(Math.round(framePoint.y), 0, h),
          color,
          isKeyframe: true,
        });
      }
    }

    frames.push({
      name: atlasEntry.name,
      width: w,
      height: h,
      path: tempPath,
      points,
    });
  }

  let groups: CliPointGroup[] | undefined;
  if (parsed.groups && typeof parsed.groups === "object") {
    groups = Object.entries(parsed.groups).map(([name, rawEntries]) => {
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

  let animation: CliAnimation | undefined;
  if (parsed.animation && typeof parsed.animation === "object") {
    const source = parsed.animation;
    animation = {
      name: typeof source.name === "string" ? source.name : undefined,
      fps: Number.isFinite(Number(source.fps)) ? Number(source.fps) : undefined,
      speed: Number.isFinite(Number(source.speed)) ? Number(source.speed) : undefined,
      loop: typeof source.loop === "boolean" ? source.loop : undefined,
      frameSelection: Array.isArray(source.frames)
        ? source.frames.filter((name: unknown): name is string => typeof name === "string")
        : undefined,
    };
  }

  const originalMode =
    meta.mode === "character" || meta.mode === "animation" || meta.mode === "normal"
      ? meta.mode
      : undefined;

  return { frames, groups, animation, mode: originalMode };
}
