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
  let pointGroups: PointGroup[] = [];
  if (pointsFile) {
    const raw = await pointsFile.text();
    const parsed = JSON.parse(raw);
    const imported = importPointsJsonToFrames(parsed, nextFrames, t);
    nextFrames = imported.frames;
    spriteDirection = imported.spriteDirection;
    pivotMode = imported.pivotMode;
    pointGroups = buildGroupsFromJson(parsed, nextFrames);
  }
  return {
    frames: nextFrames,
    pointGroups,
    spriteDirection,
    pivotMode,
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
  const modeRaw = meta.mode;
  const rows = Number.isFinite(rowsRaw) ? Math.max(1, Math.round(rowsRaw)) : undefined;
  const padding = Number.isFinite(paddingRaw)
    ? Math.max(0, Math.round(paddingRaw))
    : undefined;
  const appMode =
    modeRaw === "animation" || modeRaw === "character" ? modeRaw : undefined;

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
      downloadBlob(blob, `${exportAtlasName}.png`);
    }
  });
};

export const exportAtlasJson = ({
  frames,
  rows,
  padding,
  pivotMode,
  spriteDirection,
  appMode,
  pointGroups,
  animationName,
  fps,
  speed,
  loop,
  selectedAnimationFrames,
  exportAtlasName,
  exportDataName,
}: {
  frames: FrameData[];
  rows: number;
  padding: number;
  pivotMode: PivotMode;
  spriteDirection: SpriteDirection;
  appMode: AppMode;
  pointGroups: PointGroup[];
  animationName: string;
  fps: number;
  speed: number;
  loop: boolean;
  selectedAnimationFrames: FrameData[];
  exportAtlasName: string;
  exportDataName: string;
}) => {
  if (frames.length === 0) {
    return;
  }
  const layout = computeAtlasLayout(frames, rows, padding);
  const includePoints = appMode === "character";
  const exportedFrames = frames.map((frame, index) => {
    const cell = layout.positions[index];
    const offsetX = Math.floor((layout.cellWidth - frame.width) / 2);
    const offsetY = Math.floor((layout.cellHeight - frame.height) / 2);
    const base = {
      name: frame.name,
      x: cell.x + offsetX,
      y: cell.y + offsetY,
      w: frame.width,
      h: frame.height,
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
          x: Math.round(pivotPoint.x),
          y: Math.round(pivotPoint.y),
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
      size: { w: layout.width, h: layout.height },
      rows: layout.rows,
      columns: layout.columns,
      padding: layout.padding,
      pivot: pivotMode,
      spriteDirection,
      mode: appMode,
    },
    ...(groups ? { groups } : {}),
    ...(animation ? { animation } : {}),
    frames: exportedFrames,
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    `${exportDataName}.json`
  );
};
