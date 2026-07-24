import { useCallback, useState } from "react";
import type { ToastContextValue } from "@/components/ui/toast-context";
import type { Translate } from "@/hooks/atlas-io-types";
import type { EditorState } from "@/lib/editor-reducer";
import type { FrameData } from "@/lib/editor-types";
import {
  exportAtlasBundle,
  exportAtlasJson,
  exportAtlasPng,
  exportFramesZip,
} from "@/lib/editor-io";
import {
  MAX_EXPORT_SCALE,
  MIN_EXPORT_SCALE,
} from "@/lib/editor-helpers";

type UseEditorExportActionsParams = {
  t: Translate;
  pushToast: ToastContextValue["pushToast"];
  state: EditorState;
  selectedAnimationFrames: FrameData[];
  exportAtlasName: string;
  exportDataName: string;
};

export const useEditorExportActions = ({
  t,
  pushToast,
  state,
  selectedAnimationFrames,
  exportAtlasName,
  exportDataName,
}: UseEditorExportActionsParams) => {
  const [isExporting, setIsExporting] = useState(false);
  const {
    frames,
    rows,
    padding,
    atlasPackingMode,
    exportScale,
    exportSmoothing,
    exportFormat,
    pivotMode,
    spriteDirection,
    appMode,
    pointGroups,
    animationName,
    fps,
    speed,
    loop,
    exportSize,
    exportJsonMode,
  } = state;

  const runExport = useCallback(
    async (task: () => Promise<unknown> | void) => {
      if (isExporting) {
        return;
      }
      setIsExporting(true);
      try {
        await task();
      } catch (error) {
        console.error(error);
        pushToast({
          variant: "warning",
          title: t("error.exportFailedTitle"),
          description:
            error instanceof Error
              ? error.message
              : t("error.exportFailedBody"),
        });
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, pushToast, t]
  );

  const handleExportPng = () => {
    void runExport(() =>
      exportAtlasPng({
        frames,
        rows,
        padding,
        packingMode: atlasPackingMode,
        exportScale,
        exportSmoothing,
        exportFormat,
        exportAtlasName,
        minScale: MIN_EXPORT_SCALE,
        maxScale: MAX_EXPORT_SCALE,
      })
    );
  };

  const handleExportJson = () => {
    void runExport(() =>
      exportAtlasJson({
        frames,
        rows,
        padding,
        packingMode: atlasPackingMode,
        exportScale,
        pivotMode,
        spriteDirection,
        appMode,
        pointGroups,
        animationName,
        fps,
        speed,
        loop,
        exportSize,
        exportFormat,
        exportJsonMode,
        minScale: MIN_EXPORT_SCALE,
        maxScale: MAX_EXPORT_SCALE,
        selectedAnimationFrames,
        exportAtlasName,
        exportDataName,
      })
    );
  };

  const handleExportFramesZip = () => {
    void runExport(() => exportFramesZip({ frames, exportAtlasName }));
  };

  const handleExportBundle = () => {
    void runExport(() =>
      exportAtlasBundle({
        frames,
        rows,
        padding,
        packingMode: atlasPackingMode,
        exportScale,
        exportSmoothing,
        pivotMode,
        spriteDirection,
        appMode,
        pointGroups,
        animationName,
        fps,
        speed,
        loop,
        exportSize,
        exportJsonMode,
        minScale: MIN_EXPORT_SCALE,
        maxScale: MAX_EXPORT_SCALE,
        selectedAnimationFrames,
        exportAtlasName,
        exportDataName,
      })
    );
  };

  return {
    isExporting,
    handleExportPng,
    handleExportJson,
    handleExportBundle,
    handleExportFramesZip,
  };
};
