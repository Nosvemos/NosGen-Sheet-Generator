import type { Dispatch, SetStateAction } from "react";
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
import type { TranslationKey } from "@/lib/i18n";
import type { AtlasLayout, AtlasPackingMode } from "@/lib/editor-types";
import { ChevronDown, ChevronRight } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type AtlasSettingsCardProps = {
  t: Translate;
  isAtlasSettingsOpen: boolean;
  setIsAtlasSettingsOpen: Dispatch<SetStateAction<boolean>>;
  rows: number;
  setRows: Dispatch<SetStateAction<number>>;
  padding: number;
  setPadding: Dispatch<SetStateAction<number>>;
  atlasPackingMode: AtlasPackingMode;
  setAtlasPackingMode: Dispatch<SetStateAction<AtlasPackingMode>>;
  atlasLayout: AtlasLayout;
  sizeMismatch: boolean;
  toNumber: (value: string, fallback: number) => number;
};

export function AtlasSettingsCard({
  t,
  isAtlasSettingsOpen,
  setIsAtlasSettingsOpen,
  rows,
  setRows,
  padding,
  setPadding,
  atlasPackingMode,
  setAtlasPackingMode,
  atlasLayout,
  sizeMismatch,
  toNumber,
}: AtlasSettingsCardProps) {
  const rowsDisabled = atlasPackingMode === "shelf" || atlasPackingMode === "maxrects";
  return (
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("label.packingMode")}
            </Label>
            <Select
              value={atlasPackingMode}
              onValueChange={(value) =>
                setAtlasPackingMode(value as AtlasPackingMode)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("label.packingMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maxrects">{t("packing.maxrects")}</SelectItem>
                <SelectItem value="shelf">{t("packing.shelf")}</SelectItem>
                <SelectItem value="tight">{t("packing.tight")}</SelectItem>
                <SelectItem value="uniform">{t("packing.uniform")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("hint.packingMode")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rows-input">{t("label.rows")}</Label>
              <Input
                id="rows-input"
                type="number"
                min={1}
                disabled={rowsDisabled}
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
  );
}
