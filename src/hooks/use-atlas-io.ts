import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AppMode,
  FrameData,
  PivotMode,
  PointGroup,
  SpriteDirection,
} from "@/lib/editor-types";
import {
  createNewAtlasFromFiles,
  importAtlasFromFiles,
  importPointsIntoFrames,
} from "@/lib/editor-io";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type UseAtlasIOParams = {
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
  setAnimationFrameSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
};

type UseAtlasIOResult = {
  framesInputRef: RefObject<HTMLInputElement | null>;
  newPointsInputRef: RefObject<HTMLInputElement | null>;
  editAtlasPngInputRef: RefObject<HTMLInputElement | null>;
  editAtlasJsonInputRef: RefObject<HTMLInputElement | null>;
  setEditAtlasPngFile: Dispatch<SetStateAction<File | null>>;
  setEditAtlasJsonFile: Dispatch<SetStateAction<File | null>>;
  isEditImporting: boolean;
  handleNewAtlasCreate: () => Promise<void>;
  handleNewPointsImport: (file: File) => Promise<void>;
  handleClearFrames: () => void;
};

export const useAtlasIO = ({
  t,
  frames,
  setFrames,
  setCurrentFrameIndex,
  setSelectedPointId,
  setIsPlaying,
  setIsGroupPreviewActive,
  setIsGroupPreviewPlaying,
  setGroupPreviewIndex,
  setPointGroups,
  setSelectedGroupId,
  setSpriteDirection,
  setPivotMode,
  setRows,
  setPadding,
  setAppMode,
  setAnimationName,
  setFps,
  setSpeed,
  setLoop,
  setProjectName,
  setExportSize,
  setAnimationFrameSelection,
}: UseAtlasIOParams): UseAtlasIOResult => {
  const framesInputRef = useRef<HTMLInputElement>(null);
  const newPointsInputRef = useRef<HTMLInputElement>(null);
  const editAtlasPngInputRef = useRef<HTMLInputElement>(null);
  const editAtlasJsonInputRef = useRef<HTMLInputElement>(null);
  const [editAtlasPngFile, setEditAtlasPngFile] = useState<File | null>(null);
  const [editAtlasJsonFile, setEditAtlasJsonFile] = useState<File | null>(null);
  const [isEditImporting, setIsEditImporting] = useState(false);

  const resetSelection = () => {
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
    setIsGroupPreviewActive(false);
    setIsGroupPreviewPlaying(false);
    setGroupPreviewIndex(0);
  };

  const handleNewAtlasCreate = async () => {
    const files = framesInputRef.current?.files;
    if (!files || files.length === 0) {
      return;
    }
    const pngFiles = Array.from(files).filter(
      (file) =>
        file.type === "image/png" ||
        file.name.toLowerCase().endsWith(".png")
    );
    if (pngFiles.length === 0) {
      return;
    }
    const pointsFile = newPointsInputRef.current?.files?.[0] ?? null;
    try {
      const result = await createNewAtlasFromFiles({
        pngFiles,
        pointsFile,
        t,
      });
      if (result.spriteDirection) {
        setSpriteDirection(result.spriteDirection);
      }
      if (result.pivotMode) {
        setPivotMode(result.pivotMode);
      }
      if (typeof result.exportSize === "number") {
        setExportSize(result.exportSize);
      }
      setPointGroups(result.pointGroups);
      setSelectedGroupId(result.pointGroups[0]?.id ?? null);
      setFrames(result.frames);
      resetSelection();
    } catch (error) {
      console.error(error);
    } finally {
      if (framesInputRef.current) {
        framesInputRef.current.value = "";
      }
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleNewPointsImport = async (file: File) => {
    if (frames.length === 0) {
      return;
    }
    try {
      const imported = await importPointsIntoFrames({
        pointsFile: file,
        frames,
        t,
      });
      setFrames(imported.frames);
      if (imported.spriteDirection) {
        setSpriteDirection(imported.spriteDirection);
      }
      if (imported.pivotMode) {
        setPivotMode(imported.pivotMode);
      }
      if (typeof imported.exportSize === "number") {
        setExportSize(imported.exportSize);
      }
      setPointGroups(imported.pointGroups);
      setSelectedGroupId(imported.pointGroups[0]?.id ?? null);
      setSelectedPointId(null);
      setIsGroupPreviewActive(false);
      setIsGroupPreviewPlaying(false);
      setGroupPreviewIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleClearFrames = () => {
    setFrames([]);
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
  };

  const handleEditAtlasImport = async (pngFile: File, jsonFile: File) => {
    const imported = await importAtlasFromFiles({ pngFile, jsonFile, t });
    if (!imported) {
      return;
    }
    if (imported.spriteDirection) {
      setSpriteDirection(imported.spriteDirection);
    }
    if (imported.pivotMode) {
      setPivotMode(imported.pivotMode);
    }
    if (typeof imported.rows === "number") {
      setRows(imported.rows);
    }
    if (typeof imported.padding === "number") {
      setPadding(imported.padding);
    }
    if (imported.appMode) {
      setAppMode(imported.appMode);
    }
    if (imported.animation?.name) {
      setAnimationName(imported.animation.name);
    }
    if (typeof imported.animation?.fps === "number") {
      setFps(imported.animation.fps);
    }
    if (typeof imported.animation?.speed === "number") {
      setSpeed(imported.animation.speed);
    }
    if (typeof imported.animation?.loop === "boolean") {
      setLoop(imported.animation.loop);
    }
    if (imported.projectName) {
      setProjectName(imported.projectName);
    }
    if (typeof imported.exportSize === "number") {
      setExportSize(imported.exportSize);
    }
    setPointGroups(imported.pointGroups);
    setSelectedGroupId(imported.pointGroups[0]?.id ?? null);
    if (imported.animation?.frameSelection) {
      setAnimationFrameSelection(imported.animation.frameSelection);
    }
    setFrames(imported.frames);
    resetSelection();
  };

  useEffect(() => {
    if (!editAtlasPngFile || !editAtlasJsonFile) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsEditImporting(true);
      try {
        await handleEditAtlasImport(editAtlasPngFile, editAtlasJsonFile);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setIsEditImporting(false);
          setEditAtlasPngFile(null);
          setEditAtlasJsonFile(null);
          if (editAtlasPngInputRef.current) {
            editAtlasPngInputRef.current.value = "";
          }
          if (editAtlasJsonInputRef.current) {
            editAtlasJsonInputRef.current.value = "";
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [editAtlasPngFile, editAtlasJsonFile]);

  return {
    framesInputRef,
    newPointsInputRef,
    editAtlasPngInputRef,
    editAtlasJsonInputRef,
    setEditAtlasPngFile,
    setEditAtlasJsonFile,
    isEditImporting,
    handleNewAtlasCreate,
    handleNewPointsImport,
    handleClearFrames,
  };
};
