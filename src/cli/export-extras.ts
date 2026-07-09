import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";
import sharp from "sharp";
import {
  serializeAtlasPayload,
  type AtlasPayload,
} from "../lib/atlas-format.ts";
import type { AtlasImageFormat, AtlasLayout } from "../lib/editor-types.ts";
import type { CliConfig } from "./types.ts";
import type { CliFrame } from "./frame-types.ts";
import { buildJsonPayload } from "./json-payload.ts";
import { renderAtlas } from "./render-atlas.ts";
import * as math from "./math.ts";

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

const resolveExportDataName = (baseName: string) => {
  if (baseName.endsWith("_data")) {
    return baseName;
  }
  if (baseName.endsWith("_atlas")) {
    return `${baseName.slice(0, -6)}_data`;
  }
  return `${baseName}_data`;
};

export const exportFramesZip = async (
  frames: CliFrame[],
  outputDir: string,
  baseName: string
) => {
  if (frames.length === 0) {
    return;
  }
  const zip = new JSZip();
  const usedNames = new Map<string, number>();
  await Promise.all(
    frames.map(async (frame, index) => {
      const filename = buildUniqueFrameName(frame.name, index, usedNames);
      const blob = await sharp(frame.path).png({ compressionLevel: 9 }).toBuffer();
      zip.file(filename, blob);
    })
  );
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const zipPath = join(outputDir, `${baseName}_frames.zip`);
  await writeFile(zipPath, zipBuffer);
  console.log(`Frames ZIP saved: ${zipPath}`);
};

export const exportAtlasBundle = async ({
  frames,
  layout,
  config,
  outputDir,
  baseName,
}: {
  frames: CliFrame[];
  layout: AtlasLayout;
  config: CliConfig;
  outputDir: string;
  baseName: string;
}) => {
  if (frames.length === 0) {
    return;
  }
  const zip = new JSZip();
  const formats: AtlasImageFormat[] = ["png", "webp", "ktx2"];
  const bundleConfig = {
    ...config,
    name: baseName,
    export: {
      ...config.export,
      format: "png" as const,
    },
  };
  const renderedAtlases = await Promise.all(
    formats.map(async (format) => ({
      format,
      rendered: await renderAtlas(frames, layout, {
        ...config.export,
        format,
      }),
    }))
  );
  const jsonAtlas =
    renderedAtlases.find(({ format }) => format === "png")?.rendered ??
    renderedAtlases[0].rendered;
  const payload = buildJsonPayload(
    frames,
    layout,
    bundleConfig,
    jsonAtlas.targetWidth,
    jsonAtlas.targetHeight,
    jsonAtlas.scaleX,
    jsonAtlas.scaleY
  );

  await Promise.all(
    renderedAtlases.map(async ({ format, rendered }) => {
      const buffer = Buffer.isBuffer(rendered.atlas)
        ? rendered.atlas
        : await rendered.atlas.toBuffer();
      zip.file(`${baseName}_atlas.${format}`, buffer);
    })
  );

  const jsonMode = config.export?.jsonMode ?? "pretty";
  zip.file(
    `${resolveExportDataName(baseName)}.json`,
    serializeAtlasPayload(payload as unknown as AtlasPayload, jsonMode)
  );

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const zipPath = join(outputDir, `${baseName}_bundle.zip`);
  await writeFile(zipPath, zipBuffer);
  console.log(`Bundle saved: ${zipPath}`);
};

export const normalizeCliExportName = (name: string) =>
  math.normalizeExportName(name, "sprite");
