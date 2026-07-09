import { isSupportedAtlasImageFile } from "@/lib/texture-codecs";

type DroppedAtlasFiles =
  | { kind: "new"; imageFiles: File[]; pointsFile: File | null }
  | { kind: "edit"; pngFile: File; jsonFile: File };

const isJsonFile = (file: File) =>
  file.type === "application/json" || file.name.toLowerCase().endsWith(".json");

const looksLikeAtlasDataFile = async (file: File) => {
  try {
    const parsed = JSON.parse(await file.text()) as {
      frames?: Array<{ x?: unknown; y?: unknown; w?: unknown; h?: unknown }>;
    };
    return (
      Array.isArray(parsed.frames) &&
      parsed.frames.some(
        (frame) =>
          Number.isFinite(Number(frame?.x)) &&
          Number.isFinite(Number(frame?.y)) &&
          Number.isFinite(
            Number(frame?.w ?? (frame as { width?: unknown }).width)
          ) &&
          Number.isFinite(
            Number(frame?.h ?? (frame as { height?: unknown }).height)
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
