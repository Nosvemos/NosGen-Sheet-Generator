import type { Dispatch, RefObject, SetStateAction } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  AtlasImageFormat,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
} from "@/lib/editor-types";

export type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export type UseAtlasIOParams = {
  t: Translate;
  frames: FrameData[];
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  setSelectedPointId: Dispatch<SetStateAction<string | null>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setIsGroupPreviewActive: Dispatch<SetStateAction<boolean>>;
  setIsGroupPreviewPlaying: Dispatch<SetStateAction<boolean>>;
  setGroupPreviewIndex: Dispatch<SetStateAction<number>>;
  setPointGroups: Dispatch<SetStateAction<PointGroup[]>>;
  setSelectedGroupId: Dispatch<SetStateAction<string | null>>;
  setSpriteDirection: Dispatch<SetStateAction<SpriteDirection>>;
  setPivotMode: Dispatch<SetStateAction<PivotMode>>;
  setRows: Dispatch<SetStateAction<number>>;
  setPadding: Dispatch<SetStateAction<number>>;
  setAppMode: Dispatch<SetStateAction<AppMode>>;
  setAnimationName: Dispatch<SetStateAction<string>>;
  setFps: Dispatch<SetStateAction<number>>;
  setSpeed: Dispatch<SetStateAction<number>>;
  setLoop: Dispatch<SetStateAction<boolean>>;
  setProjectName: Dispatch<SetStateAction<string>>;
  setExportSize: Dispatch<SetStateAction<number>>;
  setExportFormat: Dispatch<SetStateAction<AtlasImageFormat>>;
  setAnimationFrameSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  supportLegacyAtlas: boolean;
};

export type UseAtlasIOResult = {
  framesInputRef: RefObject<HTMLInputElement | null>;
  newPointsInputRef: RefObject<HTMLInputElement | null>;
  appendFramesInputRef: RefObject<HTMLInputElement | null>;
  editAtlasPngInputRef: RefObject<HTMLInputElement | null>;
  editAtlasJsonInputRef: RefObject<HTMLInputElement | null>;
  setEditAtlasPngFile: Dispatch<SetStateAction<File | null>>;
  setEditAtlasJsonFile: Dispatch<SetStateAction<File | null>>;
  isEditImporting: boolean;
  hasEditImport: boolean;
  handleNewAtlasCreate: () => Promise<void>;
  handleAppendFrames: () => Promise<void>;
  handleNewPointsImport: (file: File) => Promise<void>;
  handleDroppedFiles: (files: File[] | FileList) => Promise<void>;
  handleClearFrames: () => void;
};
