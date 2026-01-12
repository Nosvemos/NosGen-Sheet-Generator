import type { Dispatch, RefObject, SetStateAction } from "react";
import { Separator } from "@/components/ui/separator";
import type { TranslationKey } from "@/lib/i18n";
import type { AtlasLayout, PivotMode, SpriteDirection } from "@/lib/editor-types";
import { AtlasSettingsCard } from "@/components/editor/right-sidebar/AtlasSettingsCard";
import { EditCurrentCard } from "@/components/editor/right-sidebar/EditCurrentCard";
import { ExportActions } from "@/components/editor/right-sidebar/ExportActions";
import { ExportQualityCard } from "@/components/editor/right-sidebar/ExportQualityCard";
import { NewAtlasCard } from "@/components/editor/right-sidebar/NewAtlasCard";
import { RightSidebarHeader } from "@/components/editor/right-sidebar/RightSidebarHeader";
import { SpriteSettingsCard } from "@/components/editor/right-sidebar/SpriteSettingsCard";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export type RightSidebarProps = {
  t: Translate;
  framesLength: number;
  framesInputRef: RefObject<HTMLInputElement | null>;
  newPointsInputRef: RefObject<HTMLInputElement | null>;
  handleNewAtlasCreate: () => Promise<void> | void;
  handleNewPointsImport: (file: File) => Promise<void> | void;
  onClearFrames: () => void;
  editAtlasPngInputRef: RefObject<HTMLInputElement | null>;
  editAtlasJsonInputRef: RefObject<HTMLInputElement | null>;
  setEditAtlasPngFile: Dispatch<SetStateAction<File | null>>;
  setEditAtlasJsonFile: Dispatch<SetStateAction<File | null>>;
  isEditImporting: boolean;
  isSpriteSettingsOpen: boolean;
  setIsSpriteSettingsOpen: Dispatch<SetStateAction<boolean>>;
  spriteDirection: SpriteDirection;
  setSpriteDirection: Dispatch<SetStateAction<SpriteDirection>>;
  isAtlasSettingsOpen: boolean;
  setIsAtlasSettingsOpen: Dispatch<SetStateAction<boolean>>;
  rows: number;
  setRows: Dispatch<SetStateAction<number>>;
  padding: number;
  setPadding: Dispatch<SetStateAction<number>>;
  atlasLayout: AtlasLayout;
  sizeMismatch: boolean;
  toNumber: (value: string, fallback: number) => number;
  isExportQualityOpen: boolean;
  setIsExportQualityOpen: Dispatch<SetStateAction<boolean>>;
  exportScale: number;
  setExportScale: Dispatch<SetStateAction<number>>;
  exportSmoothing: boolean;
  setExportSmoothing: Dispatch<SetStateAction<boolean>>;
  handleExportPng: () => void;
  handleExportJson: () => void;
  pivotMode: PivotMode;
  pivotLabels: Record<PivotMode, string>;
  minExportScale: number;
  maxExportScale: number;
  exportScaleStep: number;
};

export function RightSidebar({
  t,
  framesLength,
  framesInputRef,
  newPointsInputRef,
  handleNewAtlasCreate,
  handleNewPointsImport,
  onClearFrames,
  editAtlasPngInputRef,
  editAtlasJsonInputRef,
  setEditAtlasPngFile,
  setEditAtlasJsonFile,
  isEditImporting,
  isSpriteSettingsOpen,
  setIsSpriteSettingsOpen,
  spriteDirection,
  setSpriteDirection,
  isAtlasSettingsOpen,
  setIsAtlasSettingsOpen,
  rows,
  setRows,
  padding,
  setPadding,
  atlasLayout,
  sizeMismatch,
  toNumber,
  isExportQualityOpen,
  setIsExportQualityOpen,
  exportScale,
  setExportScale,
  exportSmoothing,
  setExportSmoothing,
  handleExportPng,
  handleExportJson,
  pivotMode,
  pivotLabels,
  minExportScale,
  maxExportScale,
  exportScaleStep,
}: RightSidebarProps) {
  return (
    <aside className="h-full min-h-0 space-y-4 overflow-y-auto rounded-none border-0 bg-card/80 p-4 shadow-none backdrop-blur">
      <RightSidebarHeader t={t} />

      <NewAtlasCard
        t={t}
        framesLength={framesLength}
        framesInputRef={framesInputRef}
        newPointsInputRef={newPointsInputRef}
        handleNewAtlasCreate={handleNewAtlasCreate}
        handleNewPointsImport={handleNewPointsImport}
        onClearFrames={onClearFrames}
      />

      <EditCurrentCard
        t={t}
        editAtlasPngInputRef={editAtlasPngInputRef}
        editAtlasJsonInputRef={editAtlasJsonInputRef}
        setEditAtlasPngFile={setEditAtlasPngFile}
        setEditAtlasJsonFile={setEditAtlasJsonFile}
        isEditImporting={isEditImporting}
      />

      <SpriteSettingsCard
        t={t}
        isSpriteSettingsOpen={isSpriteSettingsOpen}
        setIsSpriteSettingsOpen={setIsSpriteSettingsOpen}
        spriteDirection={spriteDirection}
        setSpriteDirection={setSpriteDirection}
      />

      <AtlasSettingsCard
        t={t}
        isAtlasSettingsOpen={isAtlasSettingsOpen}
        setIsAtlasSettingsOpen={setIsAtlasSettingsOpen}
        rows={rows}
        setRows={setRows}
        padding={padding}
        setPadding={setPadding}
        atlasLayout={atlasLayout}
        sizeMismatch={sizeMismatch}
        toNumber={toNumber}
      />

      <ExportQualityCard
        t={t}
        isExportQualityOpen={isExportQualityOpen}
        setIsExportQualityOpen={setIsExportQualityOpen}
        exportScale={exportScale}
        setExportScale={setExportScale}
        exportSmoothing={exportSmoothing}
        setExportSmoothing={setExportSmoothing}
        minExportScale={minExportScale}
        maxExportScale={maxExportScale}
        exportScaleStep={exportScaleStep}
      />

      <Separator />

      <ExportActions
        t={t}
        framesLength={framesLength}
        handleExportPng={handleExportPng}
        handleExportJson={handleExportJson}
        pivotMode={pivotMode}
        pivotLabels={pivotLabels}
      />
    </aside>
  );
}
