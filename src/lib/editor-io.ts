import JSZip from "jszip";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
} from "@/lib/editor-types";
import { buildGroupsFromJson, importPointsJsonToFrames } from "@/lib/editor-imports";
import {
  clamp,
  computeAtlasLayout,
  createId,
  downloadBlob,
  loadFrameFromFile,
  loadImageFromFile,
  toPivotCoords,
} from "@/lib/editor-helpers";

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
};

type AtlasEntry = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const isNeutralinoRuntime = () =>
  typeof window !== "undefined" && "NL_OS" in window;

type SaveFilePicker = (options?: {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  excludeAcceptAllOption?: boolean;
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

const getSaveFilePicker = () =>
  (window as Window & { showSaveFilePicker?: SaveFilePicker })
    .showSaveFilePicker;

const isAbortError = (error: unknown) => {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return error.toLowerCase().includes("abort");
  }
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  if (typeof error === "object" && "name" in error) {
    return (error as { name?: string }).name === "AbortError";
  }
  return false;
};

const saveBlobWithDialog = async (
  blob: Blob,
  filename: string,
  filters: Array<{ name: string; extensions: string[] }>
) => {
  const picker = getSaveFilePicker();
  if (!isNeutralinoRuntime() && picker) {
    try {
      const types = filters.map((filter) => ({
        description: filter.name,
        accept: {
          [blob.type || "application/octet-stream"]: filter.extensions.map(
            (ext) => `.${ext}`
          ),
        },
      }));
      const handle = await picker({
        suggestedName: filename,
        types,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      console.warn(error);
    }
  }
  if (!isNeutralinoRuntime()) {
    downloadBlob(blob, filename);
    return;
  }
  try {
    const { os, filesystem } = await import("@neutralinojs/lib");
    let defaultPath = filename;
    try {
      const downloads = await os.getPath("downloads");
      if (downloads) {
        defaultPath = await filesystem.getJoinedPath(downloads, filename);
      }
    } catch {
      // Ignore path lookup errors and keep default filename.
    }
    const path = await os.showSaveDialog("Save file", {
      defaultPath,
      filters,
    });
    if (!path) {
      return;
    }
    if (blob.type === "application/json" || filename.endsWith(".json")) {
      const text = await blob.text();
      await filesystem.writeFile(path, text);
    } else {
      const data = await blob.arrayBuffer();
      await filesystem.writeBinaryFile(path, data);
    }
  } catch (error) {
    console.error(error);
  }
};

const slugifyFrameName = (name: string) => {
  const trimmed = name.trim().replace(/\.[^/.]+$/, "");
  const sanitized = trimmed.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/_+/g, "_");
  const cleaned = sanitized.replace(/^_+|_+$/g, "");
  return cleaned || "frame";
};

const buildUniqueFrameName = (
  rawName: string,
  index: number,
  usedNames: Map<string, number>
) => {
  const base = slugifyFrameName(rawName || `frame-${index + 1}`);
  const count = usedNames.get(base) ?? 0;
  usedNames.set(base, count + 1);
  const suffix = count > 0 ? `_${count + 1}` : "";
  const prefix = String(index + 1).padStart(3, "0");
  return `${prefix}_${base}${suffix}.png`;
};

const frameToPngBlob = async (frame: FrameData) => {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame.image, 0, 0, frame.width, frame.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (blob) {
    return blob;
  }
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
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
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
      }
      if (width <= 0 || height <= 0) {
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
  pngFiles,
  pointsFile,
  t,
}: {
  pngFiles: File[];
  pointsFile?: File | null;
  t: Translate;
}): Promise<NewAtlasResult> => {
  const loaded = await Promise.all(
    pngFiles.map((file) => loadFrameFromFile(file))
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
  const parsed = JSON.parse(raw);
  const entries = parseAtlasEntries(parsed);
  if (entries.length === 0) {
    return null;
  }
  const atlasImage = await loadImageFromFile(pngFile);
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
  };
};

export const exportAtlasPng = ({
  frames,
  rows,
  padding,
  exportScale,
  exportSmoothing,
  exportAtlasName,
  minScale,
  maxScale,
}: {
  frames: FrameData[];
  rows: number;
  padding: number;
  exportScale: number;
  exportSmoothing: boolean;
  exportAtlasName: string;
  minScale: number;
  maxScale: number;
}) => {
  if (frames.length === 0) {
    return;
  }
  const layout = computeAtlasLayout(frames, rows, padding);
  const scale = clamp(exportScale, minScale, maxScale);
  const targetWidth = Math.max(1, Math.round(layout.width * scale));
  const targetHeight = Math.max(1, Math.round(layout.height * scale));
  const scaleX = targetWidth / layout.width;
  const scaleY = targetHeight / layout.height;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = exportSmoothing;
  if (exportSmoothing) {
    ctx.imageSmoothingQuality = "high";
  }
  layout.positions.forEach((cell, index) => {
    const frame = frames[index];
    if (!frame) {
      return;
    }
    const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
    const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
    ctx.drawImage(
      frame.image,
      (cell.x + offsetX) * scaleX,
      (cell.y + offsetY) * scaleY,
      frame.width * scaleX,
      frame.height * scaleY
    );
  });
  canvas.toBlob((blob) => {
    if (blob) {
      void saveBlobWithDialog(blob, `${exportAtlasName}.png`, [
        { name: "PNG Image", extensions: ["png"] },
      ]);
    }
  });
};

export const exportFramesZip = async ({
  frames,
  exportAtlasName,
}: {
  frames: FrameData[];
  exportAtlasName: string;
}) => {
  if (frames.length === 0) {
    return;
  }
  const zip = new JSZip();
  const usedNames = new Map<string, number>();
  await Promise.all(
    frames.map(async (frame, index) => {
      const filename = buildUniqueFrameName(frame.name, index, usedNames);
      const blob = await frameToPngBlob(frame);
      zip.file(filename, blob);
    })
  );
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  await saveBlobWithDialog(zipBlob, `${exportAtlasName}_frames.zip`, [
    { name: "ZIP Archive", extensions: ["zip"] },
  ]);
};

export const exportAtlasJson = ({
  frames,
  rows,
  padding,
  exportScale,
  pivotMode,
  spriteDirection,
  appMode,
  pointGroups,
  animationName,
  fps,
  speed,
  loop,
  exportSize,
  minScale,
  maxScale,
  selectedAnimationFrames,
  exportAtlasName,
  exportDataName,
}: {
  frames: FrameData[];
  rows: number;
  padding: number;
  exportScale: number;
  pivotMode: PivotMode;
  spriteDirection: SpriteDirection;
  appMode: AppMode;
  pointGroups: PointGroup[];
  animationName: string;
  fps: number;
  speed: number;
  loop: boolean;
  exportSize: number;
  minScale: number;
  maxScale: number;
  selectedAnimationFrames: FrameData[];
  exportAtlasName: string;
  exportDataName: string;
}) => {
  if (frames.length === 0) {
    return;
  }
  const layout = computeAtlasLayout(frames, rows, padding);
  const scale = clamp(exportScale, minScale, maxScale);
  const targetWidth = Math.max(1, Math.round(layout.width * scale));
  const targetHeight = Math.max(1, Math.round(layout.height * scale));
  const scaleX = targetWidth / layout.width;
  const scaleY = targetHeight / layout.height;
  const includePoints = appMode === "character";
  const exportedFrames = frames.map((frame, index) => {
    const cell = layout.positions[index];
    const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
    const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
    const base = {
      name: frame.name,
      x: Math.round((cell.x + offsetX) * scaleX),
      y: Math.round((cell.y + offsetY) * scaleY),
      w: Math.round(frame.width * scaleX),
      h: Math.round(frame.height * scaleY),
    };
    if (!includePoints) {
      return base;
    }
    return {
      ...base,
      points: frame.points.map((point) => {
        const pivotPoint = toPivotCoords(point, frame, pivotMode);
        return {
          name: point.name,
          x: Math.round(pivotPoint.x * scaleX),
          y: Math.round(pivotPoint.y * scaleY),
        };
      }),
    };
  });

  let groups: Record<string, string[][]> | undefined;
  if (includePoints && pointGroups.length > 0) {
    const idToName = new Map<string, string>();
    frames[0]?.points.forEach((point) => {
      idToName.set(point.id, point.name);
    });
    groups = pointGroups.reduce<Record<string, string[][]>>((acc, group) => {
      const safeName = group.name || `group-${group.id.slice(0, 6)}`;
      acc[safeName] = group.entries.map((entry) =>
        entry.map((id) => idToName.get(id) ?? id)
      );
      return acc;
    }, {});
  }

  const animation =
    appMode === "animation"
      ? {
          name: animationName.trim() || "animation",
          fps,
          speed,
          loop,
          frames: selectedAnimationFrames.map((frame) => frame.name),
        }
      : undefined;

  const payload = {
    meta: {
      app: "NosGen",
      image: `${exportAtlasName}.png`,
      size: { w: targetWidth, h: targetHeight },
      rows: layout.rows,
      columns: layout.columns,
      padding: Math.round(layout.padding * scaleX),
      scale: exportSize,
      pivot: pivotMode,
      ...(appMode === "character" ? { spriteDirection } : {}),
      mode: appMode,
    },
    ...(groups ? { groups } : {}),
    ...(animation ? { animation } : {}),
    frames: exportedFrames,
  };

  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  void saveBlobWithDialog(jsonBlob, `${exportDataName}.json`, [
    { name: "JSON", extensions: ["json"] },
  ]);
};
