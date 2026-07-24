import JSZip from "jszip";
import type {
  AtlasImageFormat,
  AtlasPackingMode,
  ExportJsonMode,
  FrameData,
} from "@/lib/editor-types";
import {
  buildAtlasJsonPayload,
  createAtlasCanvas,
  type AtlasJsonExportParams,
} from "@/lib/editor-export-builders";
import { saveBlobWithDialog } from "@/lib/editor-save-dialog";
import { serializeAtlasPayload } from "@/lib/atlas-format";
import {
  encodeCanvasToAtlasBlob,
  getAtlasImageFilename,
} from "@/lib/texture-codecs";

const normalizeFrameZipName = (name: string, fallback: string) => {
  const trimmed = (name || fallback).trim().replace(/\.[^/.]+$/, "");
  const sanitized = trimmed
    // eslint-disable-next-line no-control-regex -- filename sanitization needs control range
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
  return sanitized || fallback;
};

const buildUniqueFrameName = (
  rawName: string,
  index: number,
  usedNames: Map<string, number>
) => {
  const base = normalizeFrameZipName(rawName, `frame-${index + 1}`);
  const count = usedNames.get(base) ?? 0;
  usedNames.set(base, count + 1);
  const suffix = count > 0 ? `_${count + 1}` : "";
  return `${base}${suffix}.png`;
};

const resolveExportDataName = (
  exportAtlasName: string,
  exportDataName?: string
) => {
  const value = (exportDataName || exportAtlasName).trim();
  if (!value) {
    return "sprite-atlas_data";
  }
  if (value.endsWith("_data")) {
    return value;
  }
  if (value.endsWith("_atlas")) {
    return `${value.slice(0, -6)}_data`;
  }
  return `${value}_data`;
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

export const exportAtlasPng = ({
  frames,
  rows,
  padding,
  packingMode,
  exportScale,
  exportSmoothing,
  exportFormat = "png",
  exportAtlasName,
  minScale,
  maxScale,
}: {
  frames: FrameData[];
  rows: number;
  padding: number;
  packingMode: AtlasPackingMode;
  exportScale: number;
  exportSmoothing: boolean;
  exportFormat?: AtlasImageFormat;
  exportAtlasName: string;
  minScale: number;
  maxScale: number;
}) => {
  const atlas = createAtlasCanvas({
    frames,
    rows,
    padding,
    packingMode,
    exportScale,
    exportSmoothing,
    minScale,
    maxScale,
  });
  if (!atlas) {
    return;
  }
  const filter = { name: "PNG Image", extensions: ["png"] };
  return encodeCanvasToAtlasBlob(atlas.canvas, exportFormat).then((blob) =>
    saveBlobWithDialog(
      blob,
      getAtlasImageFilename(exportAtlasName, exportFormat),
      [filter]
    )
  );
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
  exportFormat = "png",
  exportJsonMode,
  minScale,
  maxScale,
  selectedAnimationFrames,
  exportAtlasName,
  exportDataName,
}: AtlasJsonExportParams & {
  exportJsonMode: ExportJsonMode;
  exportDataName: string;
}) => {
  const resolvedExportDataName = resolveExportDataName(
    exportAtlasName,
    exportDataName
  );
  const payload = buildAtlasJsonPayload({
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
  });
  if (!payload) {
    return;
  }

  const jsonBlob = new Blob([serializeAtlasPayload(payload, exportJsonMode)], {
    type: "application/json",
  });
  return saveBlobWithDialog(jsonBlob, `${resolvedExportDataName}.json`, [
    { name: "JSON", extensions: ["json"] },
  ]);
};

export const exportAtlasBundle = async ({
  frames,
  rows,
  padding,
  packingMode,
  exportScale,
  exportSmoothing,
  pivotMode,
  spriteDirection,
  appMode,
  pointGroups,
  animationName,
  fps,
  speed,
  loop,
  exportSize,
  exportJsonMode,
  minScale,
  maxScale,
  selectedAnimationFrames,
  exportAtlasName,
  exportDataName,
}: Omit<AtlasJsonExportParams, "exportFormat"> & {
  exportSmoothing: boolean;
  exportJsonMode: ExportJsonMode;
  exportDataName: string;
}) => {
  const resolvedExportDataName = resolveExportDataName(
    exportAtlasName,
    exportDataName
  );
  const atlas = createAtlasCanvas({
    frames,
    rows,
    padding,
    packingMode,
    exportScale,
    exportSmoothing,
    minScale,
    maxScale,
  });
  if (!atlas) {
    return;
  }

  const jsonPayload = buildAtlasJsonPayload({
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
    exportFormat: "png",
    minScale,
    maxScale,
    selectedAnimationFrames,
    exportAtlasName,
  });
  if (!jsonPayload) {
    return;
  }

  const zip = new JSZip();
  const pngBlob = await encodeCanvasToAtlasBlob(atlas.canvas, "png");
  zip.file(getAtlasImageFilename(exportAtlasName, "png"), pngBlob);
  zip.file(
    `${resolvedExportDataName}.json`,
    serializeAtlasPayload(jsonPayload, exportJsonMode)
  );

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  await saveBlobWithDialog(zipBlob, `${exportAtlasName}_bundle.zip`, [
    { name: "ZIP Archive", extensions: ["zip"] },
  ]);
};
