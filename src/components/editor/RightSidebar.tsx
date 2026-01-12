import type { Dispatch, RefObject, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AtlasLayout,
  PivotMode,
  SpriteDirection,
} from "@/lib/editor-types";
import { ChevronDown, ChevronRight, Download, Layers, Trash2 } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type RightSidebarProps = {
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("panel.importExport")}
          </p>
          <h2 className="text-lg font-semibold">{t("panel.pipeline")}</h2>
        </div>
        <Layers className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <Label>{t("label.newAtlas")}</Label>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("label.pngFrames")}
          </Label>
          <Input
            ref={framesInputRef}
            type="file"
            accept="image/png"
            multiple
            onChange={(event) => {
              if (event.target.files?.length) {
                void handleNewAtlasCreate();
              }
            }}
          />
          <div className="text-xs text-muted-foreground">{t("hint.fileOrder")}</div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("label.pointsJson")}
          </Label>
          <Input
            ref={newPointsInputRef}
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleNewPointsImport(file);
              }
            }}
          />
          <div className="text-xs text-muted-foreground">
            {t("hint.pointsOptional")}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClearFrames}
          disabled={framesLength === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("action.clearFrames")}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <Label>{t("label.editCurrent")}</Label>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("label.atlasPng")}
          </Label>
          <Input
            ref={editAtlasPngInputRef}
            type="file"
            accept="image/png"
            onChange={(event) => setEditAtlasPngFile(event.target.files?.[0] ?? null)}
            disabled={isEditImporting}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t("label.atlasJson")}
          </Label>
          <Input
            ref={editAtlasJsonInputRef}
            type="file"
            accept="application/json"
            onChange={(event) => setEditAtlasJsonFile(event.target.files?.[0] ?? null)}
            disabled={isEditImporting}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("hint.editCurrent")}</p>
        {isEditImporting && (
          <p className="text-xs text-muted-foreground">{t("hint.importing")}</p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <div className="flex items-center justify-between">
          <Label>{t("label.spriteSettings")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsSpriteSettingsOpen((prev) => !prev)}
            aria-label={t("action.toggleSpriteSettings")}
          >
            {isSpriteSettingsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isSpriteSettingsOpen && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("label.spriteDirection")}
              </Label>
              <Select
                value={spriteDirection}
                onValueChange={(value) =>
                  setSpriteDirection(value as SpriteDirection)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("label.spriteDirection")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clockwise">{t("direction.clockwise")}</SelectItem>
                  <SelectItem value="counterclockwise">
                    {t("direction.counterclockwise")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("hint.spriteSettings")}
            </p>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>{t("label.atlasSettings")}</Label>
            {sizeMismatch && (
              <Badge variant="destructive" className="text-[10px]">
                {t("status.sizeMismatch")}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsAtlasSettingsOpen((prev) => !prev)}
            aria-label={t("action.toggleAtlasSettings")}
          >
            {isAtlasSettingsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isAtlasSettingsOpen && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rows-input">{t("label.rows")}</Label>
                <Input
                  id="rows-input"
                  type="number"
                  min={1}
                  value={String(rows)}
                  onChange={(event) =>
                    setRows(Math.max(1, toNumber(event.target.value, rows)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="padding-input">{t("label.padding")}</Label>
                <Input
                  id="padding-input"
                  type="number"
                  min={0}
                  value={String(padding)}
                  onChange={(event) =>
                    setPadding(Math.max(0, toNumber(event.target.value, padding)))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("status.cellSize", {
                  w: atlasLayout.cellWidth,
                  h: atlasLayout.cellHeight,
                })}
              </span>
              <span>
                {t("status.atlasSize", {
                  w: atlasLayout.width,
                  h: atlasLayout.height,
                })}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
        <div className="flex items-center justify-between">
          <Label>{t("label.exportQuality")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExportQualityOpen((prev) => !prev)}
            aria-label={t("action.toggleExportQuality")}
          >
            {isExportQualityOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isExportQualityOpen && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("label.exportScale")}</span>
                <span className="font-mono">{exportScale.toFixed(1)}x</span>
              </div>
              <Slider
                min={minExportScale}
                max={maxExportScale}
                step={exportScaleStep}
                value={[exportScale]}
                onValueChange={(value) => {
                  const next = value[0] ?? exportScale;
                  setExportScale(Math.round(next * 2) / 2);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="export-smoothing"
                checked={exportSmoothing}
                onCheckedChange={setExportSmoothing}
              />
              <Label htmlFor="export-smoothing">{t("label.smoothing")}</Label>
            </div>
            <p className="text-xs text-muted-foreground">{t("hint.exportQuality")}</p>
          </>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t("label.export")}</Label>
        <div className="grid gap-2">
          <Button onClick={handleExportPng} disabled={framesLength === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t("action.exportPng")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportJson}
            disabled={framesLength === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("action.exportJson")}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("label.pivotSpace")}: {pivotLabels[pivotMode]}
        </div>
      </div>
    </aside>
  );
}
