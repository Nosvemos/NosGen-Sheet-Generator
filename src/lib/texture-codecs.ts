import type {
  ICompressedFormatCapabilities,
  IDecodedData,
  IKTX2DecoderOptions,
} from "@babylonjs/core/Materials/Textures/ktx2decoderTypes.js";
import mscBasisTranscoderJsUrl from "@babylonjs/ktx2decoder/wasm/msc_basis_transcoder.js?url";
import mscBasisTranscoderWasmUrl from "@babylonjs/ktx2decoder/wasm/msc_basis_transcoder.wasm?url";
import uastcAstcWasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_astc.wasm?url";
import uastcBc7WasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_bc7.wasm?url";
import uastcR8WasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_r8_unorm.wasm?url";
import uastcRg8WasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_rg8_unorm.wasm?url";
import uastcRgbaSrgbWasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_rgba8_srgb_v2.wasm?url";
import uastcRgbaUnormWasmUrl from "@babylonjs/ktx2decoder/wasm/uastc_rgba8_unorm_v2.wasm?url";
import type { AtlasImageFormat } from "@/lib/editor-types";

export const ATLAS_IMAGE_FORMATS = ["png", "webp", "ktx2"] as const;

export const ATLAS_IMAGE_ACCEPT = [
  "image/png",
  "image/webp",
  ".png",
  ".webp",
  ".ktx2",
].join(",");

export const ATLAS_IMAGE_MIME_TYPES: Record<Exclude<AtlasImageFormat, "ktx2">, string> = {
  png: "image/png",
  webp: "image/webp",
};

const SUPPORTED_IMAGE_EXTENSIONS = new Set(
  ATLAS_IMAGE_FORMATS.map((format) => `.${format}`)
);
const BASIS_ENCODER_JS_URL = "/ktx2-encoder/basis_encoder.js";
const BASIS_ENCODER_WASM_URL = "/ktx2-encoder/basis_encoder.wasm";

const KTX2_CAPABILITIES: ICompressedFormatCapabilities = {
  astc: false,
  bptc: false,
  s3tc: false,
  pvrtc: false,
  etc1: false,
  etc2: false,
};

const KTX2_DECODE_OPTIONS: IKTX2DecoderOptions = {
  forceRGBA: true,
  useRGBAIfASTCBC7NotAvailableWhenUASTC: true,
};

type DecoderInstance = {
  decode: (
    data: Uint8Array,
    caps: ICompressedFormatCapabilities,
    options?: IKTX2DecoderOptions
  ) => Promise<IDecodedData>;
};

let ktx2DecoderPromise: Promise<DecoderInstance> | null = null;

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

const blobToImage = async (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImageFromUrl(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error(`Failed to encode canvas as ${type}`));
    }, type);
  });

const getKtx2Decoder = async (): Promise<DecoderInstance> => {
  if (!ktx2DecoderPromise) {
    ktx2DecoderPromise = import("@babylonjs/ktx2decoder").then(
      ({
        KTX2Decoder,
        MSCTranscoder,
        LiteTranscoder_UASTC_ASTC,
        LiteTranscoder_UASTC_BC7,
        LiteTranscoder_UASTC_R8_UNORM,
        LiteTranscoder_UASTC_RG8_UNORM,
        LiteTranscoder_UASTC_RGBA_SRGB,
        LiteTranscoder_UASTC_RGBA_UNORM,
      }) => {
        MSCTranscoder.UseFromWorkerThread = false;
        MSCTranscoder.JSModuleURL = mscBasisTranscoderJsUrl;
        MSCTranscoder.WasmModuleURL = mscBasisTranscoderWasmUrl;
        LiteTranscoder_UASTC_ASTC.WasmModuleURL = uastcAstcWasmUrl;
        LiteTranscoder_UASTC_BC7.WasmModuleURL = uastcBc7WasmUrl;
        LiteTranscoder_UASTC_R8_UNORM.WasmModuleURL = uastcR8WasmUrl;
        LiteTranscoder_UASTC_RG8_UNORM.WasmModuleURL = uastcRg8WasmUrl;
        LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL = uastcRgbaSrgbWasmUrl;
        LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL = uastcRgbaUnormWasmUrl;
        return new KTX2Decoder();
      }
    );
  }
  return ktx2DecoderPromise;
};

export const getAtlasImageFormat = (
  fileOrName: File | string
): AtlasImageFormat | null => {
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName.name;
  const extension = getFileExtension(name);
  if (extension === ".png" || extension === ".webp" || extension === ".ktx2") {
    return extension.slice(1) as AtlasImageFormat;
  }
  return null;
};

export const isSupportedAtlasImageFile = (file: File) => {
  const extension = getFileExtension(file.name);
  if (SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    return true;
  }
  return file.type === "image/png" || file.type === "image/webp";
};

export const getAtlasImageFilename = (
  basename: string,
  format: AtlasImageFormat
) => `${basename}.${format}`;

export const decodeKtx2ToImage = async (file: File) => {
  const decoder = await getKtx2Decoder();
  const decoded = await decoder.decode(
    new Uint8Array(await file.arrayBuffer()),
    KTX2_CAPABILITIES,
    KTX2_DECODE_OPTIONS
  );
  const baseLevel = decoded.mipmaps[0];
  if (!baseLevel?.data) {
    throw new Error(`Failed to decode ${file.name}`);
  }
  const data = new Uint8ClampedArray(decoded.width * decoded.height * 4);
  data.set(baseLevel.data);
  const imageData = new ImageData(data, decoded.width, decoded.height);
  const canvas = document.createElement("canvas");
  canvas.width = decoded.width;
  canvas.height = decoded.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }
  ctx.putImageData(imageData, 0, 0);
  const pngBlob = await canvasToBlob(canvas, "image/png");
  return blobToImage(pngBlob, file.name);
};

export const encodeCanvasToAtlasBlob = async (
  canvas: HTMLCanvasElement,
  format: AtlasImageFormat
) => {
  if (format === "ktx2") {
    const { encodeToKTX2 } = await import("ktx2-encoder");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context not available");
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const encoded = await encodeToKTX2(new Uint8Array([0]), {
      isKTX2File: true,
      isUASTC: true,
      needSupercompression: true,
      enableRDO: true,
      uastcLDRQualityLevel: 2,
      isPerceptual: true,
      isSetKTX2SRGBTransferFunc: true,
      jsUrl: BASIS_ENCODER_JS_URL,
      wasmUrl: BASIS_ENCODER_WASM_URL,
      imageDecoder: async () => ({
        width: canvas.width,
        height: canvas.height,
        data: new Uint8Array(imageData.data),
      }),
    });
    return new Blob([new Uint8Array(encoded)], {
      type: "application/octet-stream",
    });
  }
  return canvasToBlob(canvas, ATLAS_IMAGE_MIME_TYPES[format]);
};

export const loadAtlasImageFromFile = async (file: File) => {
  if (getAtlasImageFormat(file) === "ktx2") {
    return decodeKtx2ToImage(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await loadImageFromUrl(url, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
};
