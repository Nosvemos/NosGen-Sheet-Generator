import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  AtlasImageFormat,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
} from "@/lib/editor-types";
import { buildGroupsFromJson, importPointsJsonToFrames } from "@/lib/editor-imports";
import {
  createId,
  loadFrameFromFile,
  loadImageFromFile,
} from "@/lib/editor-helpers";
import { normalizeAtlasPayload } from "@/lib/atlas-format";
import { getAtlasImageFormat } from "@/lib/texture-codecs";

export {
  exportAtlasBundle,
  exportAtlasJson,
  exportAtlasPng,
  exportFramesZip,
} from "@/lib/editor-exports";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type NewAtlasResult = {
  frames: FrameData[];
  pointGroups: PointGroup[];
  spriteDirection?: SpriteDirection;
  pivotMode?: PivotMode;
  exportSize?: number;
};

type AtlasImportResult = {
  frames: FrameData[];
  pointGroups: PointGroup[];
  spriteDirection?: SpriteDirection;
  pivotMode?: PivotMode;
  rows?: number;
  padding?: number;
  appMode?: AppMode;
  animation?: {
    name?: string;
    fps?: number;
    speed?: number;
    loop?: boolean;
    frameSelection?: Record<string, boolean>;
  };
  projectName?: string;
  exportSize?: number;
  exportFormat?: AtlasImageFormat;
};

type AtlasEntry = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const parseAtlasEntries = (parsed: unknown): AtlasEntry[] => {
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  const payload = parsed as {
    frames?: Array<{
      name?: string;
      filename?: string;
      id?: string;
      w?: number;
      h?: number;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
    }>;
  };
  if (!Array.isArray(payload.frames)) {
    return [];
  }
  return payload.frames
    .map((entry) => {
      const width = Number(entry.w ?? entry.width ?? 0);
      const height = Number(entry.h ?? entry.height ?? 0);
      const x = Number(entry.x ?? 0);
      const y = Number(entry.y ?? 0);
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        return null;
      }
      if (width <= 0 || height <= 0 || x < 0 || y < 0) {
        return null;
      }
      return {
        name: entry.name || entry.filename || entry.id || "frame",
        x,
        y,
        w: width,
        h: height,
      };
    })
    .filter(Boolean) as AtlasEntry[];
};

const validateAtlasEntries = (
  entries: AtlasEntry[],
  atlasImage: HTMLImageElement
) => {
  const width = atlasImage.naturalWidth || atlasImage.width;
  const height = atlasImage.naturalHeight || atlasImage.height;
  const invalid = entries.find(
    (entry) => entry.x + entry.w > width || entry.y + entry.h > height
  );
  if (invalid) {
    throw new Error(
      `Invalid atlas frame bounds for ${invalid.name}: ${invalid.x},${invalid.y},${invalid.w},${invalid.h}`
    );
  }
};

const sliceAtlasFrames = async (
  atlasImage: HTMLImageElement,
  entries: AtlasEntry[]
) => {
  const frames = await Promise.all(
    entries.map(async (entry, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = entry.w;
      canvas.height = entry.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        atlasImage,
        entry.x,
        entry.y,
        entry.w,
        entry.h,
        0,
        0,
        entry.w,
        entry.h
      );
      const dataUrl = canvas.toDataURL("image/png");
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to slice atlas frame"));
        img.src = dataUrl;
      });
      return {
        id: createId(),
        name: entry.name || `frame-${index + 1}`,
        image: img,
        width: entry.w,
        height: entry.h,
        points: [],
      } as FrameData;
    })
  );
  return frames.filter(Boolean) as FrameData[];
};

export const createNewAtlasFromFiles = async ({
  imageFiles,
  pointsFile,
  t,
}: {
  imageFiles: File[];
  pointsFile?: File | null;
  t: Translate;
}): Promise<NewAtlasResult> => {
  const loaded = await Promise.all(
    imageFiles.map((file) => loadFrameFromFile(file))
  );
  let nextFrames = loaded;
  let spriteDirection: SpriteDirection | undefined;
  let pivotMode: PivotMode | undefined;
  let exportSize: number | undefined;
  let pointGroups: PointGroup[] = [];
  if (pointsFile) {
    const raw = await pointsFile.text();
    const parsed = JSON.parse(raw);
    const imported = importPointsJsonToFrames(parsed, nextFrames, t);
    nextFrames = imported.frames;
    spriteDirection = imported.spriteDirection;
    pivotMode = imported.pivotMode;
    exportSize = imported.exportSize;
    pointGroups = buildGroupsFromJson(parsed, nextFrames);
  }
  return {
    frames: nextFrames,
    pointGroups,
    spriteDirection,
    pivotMode,
    exportSize,
  };
};

export const importPointsIntoFrames = async ({
  pointsFile,
  frames,
  t,
}: {
  pointsFile: File;
  frames: FrameData[];
  t: Translate;
}): Promise<NewAtlasResult> => {
  const raw = await pointsFile.text();
  const parsed = JSON.parse(raw);
  const imported = importPointsJsonToFrames(parsed, frames, t);
  const groups = buildGroupsFromJson(parsed, imported.frames);
  return {
    frames: imported.frames,
    pointGroups: groups,
    spriteDirection: imported.spriteDirection,
    pivotMode: imported.pivotMode,
    exportSize: imported.exportSize,
  };
};

export const importAtlasFromFiles = async ({
  pngFile,
  jsonFile,
  t,
}: {
  pngFile: File;
  jsonFile: File;
  t: Translate;
}): Promise<AtlasImportResult | null> => {
  const raw = await jsonFile.text();
  const parsedRaw = JSON.parse(raw);
  const parsed = normalizeAtlasPayload(parsedRaw) as typeof parsedRaw;
  const entries = parseAtlasEntries(parsed);
  if (entries.length === 0) {
    return null;
  }
  const atlasImage = await loadImageFromFile(pngFile);
  validateAtlasEntries(entries, atlasImage);
  const framesFromAtlas = await sliceAtlasFrames(atlasImage, entries);
  if (framesFromAtlas.length === 0) {
    return null;
  }
  const imported = importPointsJsonToFrames(parsed, framesFromAtlas, t);
  const nextFrames = imported.frames;
  const pointGroups = buildGroupsFromJson(parsed, nextFrames);

  const meta = parsed?.meta ?? {};
  const rowsRaw = Number(meta.rows);
  const paddingRaw = Number(meta.padding);
  const exportSizeRaw = Number(meta.scale ?? meta.exportSize);
  const modeRaw = meta.mode;
  const rows = Number.isFinite(rowsRaw) ? Math.max(1, Math.round(rowsRaw)) : undefined;
  const padding = Number.isFinite(paddingRaw)
    ? Math.max(0, Math.round(paddingRaw))
    : undefined;
  const exportSize = Number.isFinite(exportSizeRaw) ? exportSizeRaw : undefined;
  const exportFormat = getAtlasImageFormat(pngFile) ?? undefined;
  const appMode =
    modeRaw === "animation" || modeRaw === "character" || modeRaw === "normal"
      ? modeRaw
      : undefined;

  let projectName: string | undefined;
  if (typeof pngFile.name === "string") {
    const baseName = pngFile.name.replace(/\.[^/.]+$/, "");
    const trimmed = baseName.endsWith("_atlas")
      ? baseName.slice(0, -6)
      : baseName;
    projectName = trimmed || undefined;
  }

  const animationPayload = parsed?.animation ?? {};
  const animation: AtlasImportResult["animation"] = {};
  if (typeof animationPayload.name === "string") {
    animation.name = animationPayload.name;
  }
  const fpsRaw = Number(animationPayload.fps);
  if (Number.isFinite(fpsRaw)) {
    animation.fps = Math.max(1, Math.round(fpsRaw));
  }
  const speedRaw = Number(animationPayload.speed);
  if (Number.isFinite(speedRaw)) {
    animation.speed = speedRaw;
  }
  if (typeof animationPayload.loop === "boolean") {
    animation.loop = animationPayload.loop;
  }
  if (Array.isArray(animationPayload.frames)) {
    const selection = new Set(
      animationPayload.frames.filter((name: unknown) => typeof name === "string")
    );
    const frameSelection: Record<string, boolean> = {};
    nextFrames.forEach((frame) => {
      frameSelection[frame.id] = selection.has(frame.name);
    });
    animation.frameSelection = frameSelection;
  }

  return {
    frames: nextFrames,
    pointGroups,
    spriteDirection: imported.spriteDirection,
    pivotMode: imported.pivotMode,
    rows,
    padding,
    exportSize,
    appMode,
    animation: Object.keys(animation).length > 0 ? animation : undefined,
    projectName,
    exportFormat,
  };
};

