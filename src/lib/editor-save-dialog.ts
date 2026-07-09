import { App } from "../../bindings/nosgen";
import { downloadBlob } from "@/lib/editor-helpers";

export type DesktopFileFilter = {
  name: string;
  extensions: string[];
};

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

const encodeBlobAsBase64 = async (source: Blob) => {
  const data = new Uint8Array(await source.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < data.length; index += chunkSize) {
    const chunk = data.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

export const saveBlobWithDialog = async (
  blob: Blob,
  filename: string,
  filters: DesktopFileFilter[]
) => {
  const picker = getSaveFilePicker();
  if (picker) {
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

  try {
    const isJson = blob.type === "application/json" || filename.endsWith(".json");
    const savedPath = await App.SaveFile({
      filename,
      data: isJson ? await blob.text() : await encodeBlobAsBase64(blob),
      isBinary: !isJson,
      filters,
    });
    if (!savedPath) {
      return;
    }
  } catch (error) {
    console.error(error);
    downloadBlob(blob, filename);
  }
};
