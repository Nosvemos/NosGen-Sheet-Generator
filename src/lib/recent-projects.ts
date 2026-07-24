import type { EditorState } from "@/lib/editor-reducer";
import type { FrameData } from "@/lib/editor-types";

const DB_NAME = "nosgen-recent-projects";
const STORE_NAME = "projects";
const DB_VERSION = 1;
const MAX_RECENT_PROJECTS = 5;

type StoredFrame = Omit<FrameData, "image"> & {
  dataUrl: string;
};

export type RecentProjectSnapshot = {
  frames: StoredFrame[];
  state: Partial<EditorState>;
};

export type RecentProjectRecord = {
  id: string;
  name: string;
  updatedAt: number;
  frameCount: number;
  appMode: EditorState["appMode"];
  snapshot: RecentProjectSnapshot;
};

export type RecentProjectSummary = Omit<RecentProjectRecord, "snapshot">;

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });

const runStore = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
) => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const frameToDataUrl = async (frame: FrameData) => {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame.image, 0, 0, frame.width, frame.height);
  return canvas.toDataURL("image/png");
};

const dataUrlToImage = (dataUrl: string, name: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to restore ${name}`));
    image.src = dataUrl;
  });

export const listRecentProjects = async (): Promise<RecentProjectSummary[]> => {
  const records = await runStore<RecentProjectRecord[]>("readonly", (store) =>
    store.getAll()
  );
  return records
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ snapshot: _snapshot, ...summary }) => {
      void _snapshot;
      return summary;
    });
};

export const deleteRecentProject = async (id: string) => {
  await runStore<undefined>("readwrite", (store) => store.delete(id));
};

export const saveRecentProject = async (
  state: EditorState
): Promise<RecentProjectSummary[]> => {
  if (state.frames.length === 0) {
    return listRecentProjects();
  }
  const id = state.projectName.trim() || "project";
  const frames = await Promise.all(
    state.frames.map(async (frame) => ({
      id: frame.id,
      name: frame.name,
      width: frame.width,
      height: frame.height,
      points: frame.points,
      dataUrl: await frameToDataUrl(frame),
    }))
  );
  const snapshot: RecentProjectSnapshot = {
    frames,
    state: {
      currentFrameIndex: state.currentFrameIndex,
      selectedPointId: null,
      editorMode: state.editorMode,
      pivotMode: state.pivotMode,
      viewMode: state.viewMode,
      appMode: state.appMode,
      rows: state.rows,
      padding: state.padding,
      showGrid: state.showGrid,
      showPoints: state.showPoints,
      frameZoom: 1,
      panOffset: { x: 0, y: 0 },
      autoFillShape: state.autoFillShape,
      autoFillSmoothing: state.autoFillSmoothing,
      spriteDirection: state.spriteDirection,
      fps: state.fps,
      speed: state.speed,
      reverse: state.reverse,
      loop: state.loop,
      exportScale: state.exportScale,
      exportSmoothing: state.exportSmoothing,
      exportSize: state.exportSize,
      exportFormat: state.exportFormat,
      exportJsonMode: state.exportJsonMode,
      atlasPackingMode: state.atlasPackingMode,
      pointGroups: state.pointGroups,
      selectedGroupId: state.selectedGroupId,
      projectName: state.projectName,
      animationName: state.animationName,
      animationFrameSelection: state.animationFrameSelection,
    },
  };
  const record: RecentProjectRecord = {
    id,
    name: state.projectName.trim() || "project",
    updatedAt: Date.now(),
    frameCount: state.frames.length,
    appMode: state.appMode,
    snapshot,
  };
  await runStore("readwrite", (store) => store.put(record));

  const summaries = await listRecentProjects();
  await Promise.all(
    summaries
      .slice(MAX_RECENT_PROJECTS)
      .map((project) => deleteRecentProject(project.id))
  );
  return listRecentProjects();
};

export const restoreRecentProject = async (
  id: string
): Promise<Partial<EditorState>> => {
  const record = await runStore<RecentProjectRecord | undefined>(
    "readonly",
    (store) => store.get(id)
  );
  if (!record) {
    throw new Error("Recent project not found");
  }
  const frames = await Promise.all(
    record.snapshot.frames.map(async (frame) => {
      const image = await dataUrlToImage(frame.dataUrl, frame.name);
      return {
        id: frame.id,
        name: frame.name,
        image,
        width: frame.width,
        height: frame.height,
        points: frame.points,
      };
    })
  );
  return {
    ...record.snapshot.state,
    frames,
    currentFrameIndex: 0,
    selectedPointId: null,
    isPlaying: false,
    isGroupPreviewActive: false,
    isGroupPreviewPlaying: false,
    groupPreviewIndex: 0,
  };
};
