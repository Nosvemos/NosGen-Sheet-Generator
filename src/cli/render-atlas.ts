import sharp from "sharp";
import { resolveFramePlacements } from "../lib/atlas-layout.ts";
import type { AtlasLayout } from "../lib/editor-types.ts";
import type { CliExportConfig } from "./types.ts";
import type { CliFrame } from "./frame-types.ts";
import * as math from "./math.ts";

export async function renderAtlas(
  frames: CliFrame[],
  layout: AtlasLayout,
  exportConfig: CliExportConfig
) {
  const scale = exportConfig.scale ?? 1;
  const smoothing = exportConfig.smoothing ?? false;
  const targetWidth = Math.max(1, Math.round(layout.width * scale));
  const targetHeight = Math.max(1, Math.round(layout.height * scale));
  const scaleX = targetWidth / layout.width;
  const scaleY = targetHeight / layout.height;

  const base = sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const placements = resolveFramePlacements(layout, frames);
  const overlays = await Promise.all(
    frames.map(async (frame, index) => {
      const rect = placements[index];
      const left = Math.round(rect.x * scaleX);
      const top = Math.round(rect.y * scaleY);
      const width = Math.max(1, Math.round(rect.w * scaleX));
      const height = Math.max(1, Math.round(rect.h * scaleY));

      const buffer = await sharp(frame.path)
        .resize(width, height, {
          kernel: smoothing ? sharp.kernel.lanczos3 : sharp.kernel.nearest,
          fit: "fill",
        })
        .ensureAlpha()
        .raw()
        .toBuffer();

      return {
        input: buffer,
        raw: { width, height, channels: 4 as const },
        left,
        top,
      };
    })
  );

  const composited = base.composite(overlays);
  const format = exportConfig.format ?? "png";
  if (format === "ktx2") {
    return encodeKtx2Atlas({
      source: composited,
      targetWidth,
      targetHeight,
      scaleX,
      scaleY,
      quality: exportConfig.ktx2Quality,
    });
  }

  const atlas =
    format === "webp"
      ? composited.webp({
          quality: math.clamp(Math.round(exportConfig.webpQuality ?? 90), 1, 100),
          effort: 6,
        })
      : composited.png({ compressionLevel: 9, effort: 10 });

  return { atlas, targetWidth, targetHeight, scaleX, scaleY };
}

const encodeKtx2Atlas = async ({
  source,
  targetWidth,
  targetHeight,
  scaleX,
  scaleY,
  quality,
}: {
  source: sharp.Sharp;
  targetWidth: number;
  targetHeight: number;
  scaleX: number;
  scaleY: number;
  quality?: number;
}) => {
  const { encodeToKTX2 } = await import("ktx2-encoder");
  const raw = await source.raw().toBuffer();
  const encoded = await encodeToKTX2(new Uint8Array([0]), {
    isKTX2File: true,
    isUASTC: true,
    needSupercompression: true,
    enableRDO: true,
    uastcLDRQualityLevel: Math.round(math.clamp(quality ?? 2, 0, 3)),
    isPerceptual: true,
    isSetKTX2SRGBTransferFunc: true,
    imageDecoder: async () => ({
      width: targetWidth,
      height: targetHeight,
      data: new Uint8Array(raw),
    }),
  });
  return {
    atlas: Buffer.from(encoded),
    targetWidth,
    targetHeight,
    scaleX,
    scaleY,
  };
};
