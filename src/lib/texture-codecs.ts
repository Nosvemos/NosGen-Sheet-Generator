import type { AtlasImageFormat } from "@/lib/editor-types";

export const ATLAS_IMAGE_FORMATS = ["png"] as const;

export const ATLAS_IMAGE_ACCEPT = "image/png,.png";

export const ATLAS_IMAGE_MIME_TYPES: Record<AtlasImageFormat, string> = {
  png: "image/png",
};

const getFileExtension = (name: string) => {
  const match = /\.[^./\\]+$/.exec(name.toLowerCase());
  return match?.[0] ?? "";
};

const loadImageFromUrl = (url: string, filename: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${filename}`));
    img.src = url;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error(`Failed to encode canvas as ${type}`));
    }, type);
  });

export const getAtlasImageFormat = (
  fileOrName: File | string
): AtlasImageFormat | null => {
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName.name;
  const extension = getFileExtension(name);
  if (extension === ".png") {
    return "png";
  }
  return null;
};

export const isSupportedAtlasImageFile = (file: File) => {
  const extension = getFileExtension(file.name);
  return extension === ".png" || file.type === "image/png";
};

export const getAtlasImageFilename = (
  basename: string,
  format: AtlasImageFormat = "png"
) => `${basename}.${format}`;

export const encodeCanvasToAtlasBlob = async (
  canvas: HTMLCanvasElement,
  format: AtlasImageFormat = "png"
) => {
  return canvasToBlob(canvas, ATLAS_IMAGE_MIME_TYPES[format] ?? "image/png");
};

export const loadAtlasImageFromFile = async (file: File) => {
  const url = URL.createObjectURL(file);
  try {
    return await loadImageFromUrl(url, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
};
