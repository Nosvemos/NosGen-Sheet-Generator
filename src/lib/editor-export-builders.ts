import type {
  AppMode,
  AtlasImageFormat,
  AtlasPackingMode,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
} from "@/lib/editor-types";
import {
  clamp,
  computeAtlasLayoutByMode,
  resolveFramePlacements,
  toPivotCoords,
} from "@/lib/editor-helpers";
import type { AtlasPayload } from "@/lib/atlas-format";
import { getAtlasImageFilename } from "@/lib/texture-codecs";

type AtlasExportCommonParams = {
  frames: FrameData[];
  rows: number;
  padding: number;
  packingMode: AtlasPackingMode;
  exportScale: number;
  minScale: number;
  maxScale: number;
};

export type AtlasJsonExportParams = AtlasExportCommonParams & {
  pivotMode: PivotMode;
  spriteDirection: SpriteDirection;
  appMode: AppMode;
  pointGroups: PointGroup[];
  animationName: string;
  fps: number;
  speed: number;
  loop: boolean;
  exportSize: number;
  exportFormat: AtlasImageFormat;
  selectedAnimationFrames: FrameData[];
  exportAtlasName: string;
};

export const createAtlasCanvas = ({
  frames,
  rows,
  padding,
  packingMode,
  exportScale,
  exportSmoothing,
  minScale,
  maxScale,
}: AtlasExportCommonParams & { exportSmoothing: boolean }) => {
  if (frames.length === 0) {
    return null;
  }
  const layout = computeAtlasLayoutByMode(frames, {
    mode: packingMode,
    rows,
    padding,
  });
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
    return null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = exportSmoothing;
  if (exportSmoothing) {
    ctx.imageSmoothingQuality = "high";
  }
  const placements = resolveFramePlacements(layout, frames);
  placements.forEach((rect, index) => {
    const frame = frames[index];
    if (!frame) {
      return;
    }
    ctx.drawImage(
      frame.image,
      rect.x * scaleX,
      rect.y * scaleY,
      rect.w * scaleX,
      rect.h * scaleY
    );
  });
  return {
    canvas,
    layout,
    targetWidth,
    targetHeight,
    scaleX,
    scaleY,
  };
};

export const buildAtlasJsonPayload = ({
  frames,
  rows,
  padding,
  packingMode,
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
  exportFormat,
  minScale,
  maxScale,
  selectedAnimationFrames,
  exportAtlasName,
}: AtlasJsonExportParams): AtlasPayload | null => {
  if (frames.length === 0) {
    return null;
  }
  const layout = computeAtlasLayoutByMode(frames, {
    mode: packingMode,
    rows,
    padding,
  });
  const scale = clamp(exportScale, minScale, maxScale);
  const targetWidth = Math.max(1, Math.round(layout.width * scale));
  const targetHeight = Math.max(1, Math.round(layout.height * scale));
  const scaleX = targetWidth / layout.width;
  const scaleY = targetHeight / layout.height;
  const includePoints = appMode === "character";
  const placements = resolveFramePlacements(layout, frames);
  const exportedFrames = frames.map((frame, index) => {
    const rect = placements[index];
    const base = {
      name: frame.name,
      x: Math.round(rect.x * scaleX),
      y: Math.round(rect.y * scaleY),
      w: Math.round(rect.w * scaleX),
      h: Math.round(rect.h * scaleY),
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

  return {
    meta: {
      app: "NosGen",
      image: getAtlasImageFilename(exportAtlasName, exportFormat),
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
};

export const resolveEncodeQuality = (
  format: AtlasImageFormat,
  webpQuality: number,
  ktx2Quality: number
) => {
  if (format === "webp") {
    return clamp(webpQuality, 0, 100) / 100;
  }
  if (format === "ktx2") {
    return clamp(ktx2Quality, 0, 3);
  }
  return undefined;
};
