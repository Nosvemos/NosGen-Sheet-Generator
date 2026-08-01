import { isSupportedAtlasImageFile } from "@/lib/texture-codecs";

type DroppedAtlasFiles =
  | { kind: "new"; imageFiles: File[]; pointsFile: File | null }
  | { kind: "edit"; pngFile: File; jsonFile: File };

const isJsonFile = (file: File) =>
  file.type === "application/json" || file.name.toLowerCase().endsWith(".json");

const looksLikeAtlasDataFile = async (file: File) => {
  try {
    const parsed = JSON.parse(await file.text()) as {
      frames?: Array<unknown>;
      rects?: Array<unknown>;
    };
    if (Array.isArray(parsed.rects) && parsed.rects.length > 0) {
      return true;
    }
    return (
      Array.isArray(parsed.frames) &&
      parsed.frames.some(
        (frame) =>
          typeof frame === "object" &&
          frame !== null &&
          Number.isFinite(Number((frame as { x?: unknown }).x)) &&
          Number.isFinite(Number((frame as { y?: unknown }).y)) &&
          Number.isFinite(
            Number(
              (frame as { w?: unknown; width?: unknown }).w ??
                (frame as { w?: unknown; width?: unknown }).width
            )
          ) &&
          Number.isFinite(
            Number(
              (frame as { h?: unknown; height?: unknown }).h ??
                (frame as { h?: unknown; height?: unknown }).height
            )
          )
      )
    );
  } catch {
    return false;
  }
};

export const resolveDroppedAtlasFiles = async (
  files: File[] | FileList
): Promise<DroppedAtlasFiles | null> => {
  const dropped = Array.from(files);
  if (dropped.length === 0) {
    return null;
  }
  const imageFiles = dropped.filter(isSupportedAtlasImageFile);
  const jsonFiles = dropped.filter(isJsonFile);
  if (imageFiles.length === 0) {
    return null;
  }

  const atlasJson =
    jsonFiles.length === 1 && imageFiles.length === 1 ? jsonFiles[0] : null;
  if (atlasJson && (await looksLikeAtlasDataFile(atlasJson))) {
    return { kind: "edit", pngFile: imageFiles[0], jsonFile: atlasJson };
  }
  return {
    kind: "new",
    imageFiles,
    pointsFile: jsonFiles[0] ?? null,
  };
};
