import { useCallback, useEffect, useRef, useState } from "react";
import type {
  UseAtlasIOParams,
  UseAtlasIOResult,
} from "@/hooks/atlas-io-types";
import {
  createNewAtlasFromFiles,
  importAtlasFromFiles,
  importPointsIntoFrames,
} from "@/lib/editor-io";
import { loadFrameFromFile } from "@/lib/editor-helpers";
import { resolveDroppedAtlasFiles } from "@/lib/editor-drop-imports";
import { isSupportedAtlasImageFile } from "@/lib/texture-codecs";
import { useToast } from "@/components/ui/use-toast";

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

  const applyNewAtlasResult = useCallback(
    (result: Awaited<ReturnType<typeof createNewAtlasFromFiles>>) => {
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
    },
    [
      setExportSize,
      setFrames,
      setPivotMode,
      setPointGroups,
      setSelectedGroupId,
      setSpriteDirection,
    ]
  );

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
      applyNewAtlasResult(result);
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
      try {
        const resolved = await resolveDroppedAtlasFiles(files);
        if (!resolved) {
          return;
        }
        if (resolved.kind === "edit") {
          await handleEditAtlasImport(resolved.pngFile, resolved.jsonFile);
          return;
        }
        const result = await createNewAtlasFromFiles({
          imageFiles: resolved.imageFiles,
          pointsFile: resolved.pointsFile,
          t,
        });
        applyNewAtlasResult(result);
        setHasEditImport(false);
        resetSelection();
      } catch (error) {
        notifyError(error);
      }
    },
    [
      applyNewAtlasResult,
      handleEditAtlasImport,
      notifyError,
      resetSelection,
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
