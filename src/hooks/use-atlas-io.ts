import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  createNewAtlasFromFiles,
  importAtlasFromFiles,
  importPointsIntoFrames,
} from "@/lib/editor-io";
import { loadFrameFromFile } from "@/lib/editor-helpers";
import { isSupportedAtlasImageFile } from "@/lib/texture-codecs";
import { useToast } from "@/components/ui/use-toast";

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
  setExportFormat: Dispatch<SetStateAction<AtlasImageFormat>>;
  setAnimationFrameSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  supportLegacyAtlas: boolean;
};

type UseAtlasIOResult = {
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
          Number.isFinite(Number(frame?.w ?? (frame as { width?: unknown }).width)) &&
          Number.isFinite(Number(frame?.h ?? (frame as { height?: unknown }).height))
      )
    );
  } catch {
    return false;
  }
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
  setExportFormat,
  setAnimationFrameSelection,
  supportLegacyAtlas,
}: UseAtlasIOParams): UseAtlasIOResult => {
  const { pushToast } = useToast();
  const notifyError = useCallback(
    (error: unknown) => {
      console.error(error);
      pushToast({
        variant: "warning",
        title: t("error.importFailedTitle"),
        description:
          error instanceof Error ? error.message : t("error.importFailedBody"),
      });
    },
    [pushToast, t]
  );

  const framesInputRef = useRef<HTMLInputElement>(null);
  const newPointsInputRef = useRef<HTMLInputElement>(null);
  const appendFramesInputRef = useRef<HTMLInputElement>(null);
  const editAtlasPngInputRef = useRef<HTMLInputElement>(null);
  const editAtlasJsonInputRef = useRef<HTMLInputElement>(null);
  const [editAtlasPngFile, setEditAtlasPngFile] = useState<File | null>(null);
  const [editAtlasJsonFile, setEditAtlasJsonFile] = useState<File | null>(null);
  const [isEditImporting, setIsEditImporting] = useState(false);
  const [hasEditImport, setHasEditImport] = useState(false);

  const resetSelection = useCallback(() => {
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
    setIsGroupPreviewActive(false);
    setIsGroupPreviewPlaying(false);
    setGroupPreviewIndex(0);
  }, [
    setCurrentFrameIndex,
    setGroupPreviewIndex,
    setIsGroupPreviewActive,
    setIsGroupPreviewPlaying,
    setIsPlaying,
    setSelectedPointId,
  ]);

  const handleNewAtlasCreate = async () => {
    const files = framesInputRef.current?.files;
    if (!files || files.length === 0) {
      return;
    }
    const imageFiles = Array.from(files).filter(isSupportedAtlasImageFile);
    if (imageFiles.length === 0) {
      return;
    }
    const pointsFile = newPointsInputRef.current?.files?.[0] ?? null;
    try {
      const result = await createNewAtlasFromFiles({
        imageFiles,
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
      setHasEditImport(false);
      resetSelection();
    } catch (error) {
      notifyError(error);
    } finally {
      if (framesInputRef.current) {
        framesInputRef.current.value = "";
      }
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleAppendFrames = async () => {
    const files = appendFramesInputRef.current?.files;
    if (!files || files.length === 0) {
      return;
    }
    const imageFiles = Array.from(files).filter(isSupportedAtlasImageFile);
    if (imageFiles.length === 0) {
      return;
    }
    try {
      const loaded = await Promise.all(
        imageFiles.map((file) => loadFrameFromFile(file))
      );
      setFrames((prev) => [...prev, ...loaded]);
    } catch (error) {
      notifyError(error);
    } finally {
      if (appendFramesInputRef.current) {
        appendFramesInputRef.current.value = "";
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
      notifyError(error);
    } finally {
      if (newPointsInputRef.current) {
        newPointsInputRef.current.value = "";
      }
    }
  };

  const handleClearFrames = () => {
    if (
      frames.length > 0 &&
      typeof window !== "undefined" &&
      !window.confirm(t("confirm.clearFrames", { count: frames.length }))
    ) {
      return;
    }
    setFrames([]);
    setCurrentFrameIndex(0);
    setSelectedPointId(null);
    setIsPlaying(false);
    setHasEditImport(false);
  };

  const handleEditAtlasImport = useCallback(
    async (pngFile: File, jsonFile: File) => {
      const imported = await importAtlasFromFiles({
        pngFile,
        jsonFile,
        t,
        supportLegacyAtlas,
      });
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
      if (imported.exportFormat) {
        setExportFormat(imported.exportFormat);
      }
      setPointGroups(imported.pointGroups);
      setSelectedGroupId(imported.pointGroups[0]?.id ?? null);
      if (imported.animation?.frameSelection) {
        setAnimationFrameSelection(imported.animation.frameSelection);
      }
      setFrames(imported.frames);
      setHasEditImport(true);
      resetSelection();
    },
    [
      setAnimationFrameSelection,
      setAnimationName,
      setAppMode,
      setExportFormat,
      setExportSize,
      setFps,
      setFrames,
      setLoop,
      setPadding,
      setPivotMode,
      setPointGroups,
      setProjectName,
      setRows,
      setSelectedGroupId,
      setSpeed,
      setSpriteDirection,
      resetSelection,
      supportLegacyAtlas,
      t,
    ]
  );

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
        notifyError(error);
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
  }, [editAtlasPngFile, editAtlasJsonFile, handleEditAtlasImport, notifyError]);

  const handleDroppedFiles = useCallback(
    async (files: File[] | FileList) => {
      const dropped = Array.from(files);
      if (dropped.length === 0) {
        return;
      }
      const imageFiles = dropped.filter(isSupportedAtlasImageFile);
      const jsonFiles = dropped.filter(isJsonFile);
      if (imageFiles.length === 0) {
        return;
      }
      try {
        const atlasJson =
          jsonFiles.length === 1 && imageFiles.length === 1
            ? jsonFiles[0]
            : null;
        if (atlasJson && (await looksLikeAtlasDataFile(atlasJson))) {
          await handleEditAtlasImport(imageFiles[0], atlasJson);
          return;
        }
        const result = await createNewAtlasFromFiles({
          imageFiles,
          pointsFile: jsonFiles[0] ?? null,
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
        setHasEditImport(false);
        resetSelection();
      } catch (error) {
        notifyError(error);
      }
    },
    [
      handleEditAtlasImport,
      notifyError,
      resetSelection,
      setExportSize,
      setFrames,
      setPivotMode,
      setPointGroups,
      setSelectedGroupId,
      setSpriteDirection,
      t,
    ]
  );

  return {
    framesInputRef,
    newPointsInputRef,
    appendFramesInputRef,
    editAtlasPngInputRef,
    editAtlasJsonInputRef,
    setEditAtlasPngFile,
    setEditAtlasJsonFile,
    isEditImporting,
    hasEditImport,
    handleNewAtlasCreate,
    handleAppendFrames,
    handleNewPointsImport,
    handleDroppedFiles,
    handleClearFrames,
  };
};
