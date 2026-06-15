import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { TranslationKey } from "@/lib/i18n";
import type { AtlasImageFormat, ExportJsonMode } from "@/lib/editor-types";
import { ChevronDown, ChevronRight } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type ExportQualityCardProps = {
  t: Translate;
  isExportQualityOpen: boolean;
  setIsExportQualityOpen: Dispatch<SetStateAction<boolean>>;
  exportScale: number;
  setExportScale: Dispatch<SetStateAction<number>>;
  exportSmoothing: boolean;
  setExportSmoothing: Dispatch<SetStateAction<boolean>>;
  exportSize: number;
  setExportSize: Dispatch<SetStateAction<number>>;
  exportFormat: AtlasImageFormat;
  setExportFormat: Dispatch<SetStateAction<AtlasImageFormat>>;
  exportJsonMode: ExportJsonMode;
  setExportJsonMode: Dispatch<SetStateAction<ExportJsonMode>>;
  webpQuality: number;
  setWebpQuality: Dispatch<SetStateAction<number>>;
  ktx2Quality: number;
  setKtx2Quality: Dispatch<SetStateAction<number>>;
  toNumber: (value: string, fallback: number) => number;
  minExportScale: number;
  maxExportScale: number;
  exportScaleStep: number;
};

export function ExportQualityCard({
  t,
  isExportQualityOpen,
  setIsExportQualityOpen,
  exportScale,
  setExportScale,
  exportSmoothing,
  setExportSmoothing,
  exportSize,
  setExportSize,
  exportFormat,
  setExportFormat,
  exportJsonMode,
  setExportJsonMode,
  webpQuality,
  setWebpQuality,
  ktx2Quality,
  setKtx2Quality,
  toNumber,
  minExportScale,
  maxExportScale,
  exportScaleStep,
}: ExportQualityCardProps) {
  return (
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
              <span className="font-mono">{exportScale.toFixed(2)}x</span>
            </div>
            <Slider
              min={minExportScale}
              max={maxExportScale}
              step={exportScaleStep}
              value={[exportScale]}
              onValueChange={(value) => {
                const next = value[0] ?? exportScale;
                setExportScale(Number(next.toFixed(2)));
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("label.exportFormat")}
            </Label>
            <Select
              value={exportFormat}
              onValueChange={(value) =>
                setExportFormat(value as AtlasImageFormat)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("label.exportFormat")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">{t("format.png")}</SelectItem>
                <SelectItem value="webp">{t("format.webp")}</SelectItem>
                <SelectItem value="ktx2">{t("format.ktx2")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {exportFormat === "webp" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("label.webpQuality")}</span>
                <span className="font-mono">{Math.round(webpQuality)}</span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[webpQuality]}
                onValueChange={(value) =>
                  setWebpQuality(Math.round(value[0] ?? webpQuality))
                }
              />
            </div>
          )}
          {exportFormat === "ktx2" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("label.ktx2Quality")}</span>
                <span className="font-mono">{Math.round(ktx2Quality)}</span>
              </div>
              <Slider
                min={0}
                max={3}
                step={1}
                value={[ktx2Quality]}
                onValueChange={(value) =>
                  setKtx2Quality(Math.round(value[0] ?? ktx2Quality))
                }
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("label.jsonMode")}
            </Label>
            <Select
              value={exportJsonMode}
              onValueChange={(value) =>
                setExportJsonMode(value as ExportJsonMode)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("label.jsonMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pretty">{t("jsonMode.pretty")}</SelectItem>
                <SelectItem value="minified">
                  {t("jsonMode.minified")}
                </SelectItem>
                <SelectItem value="compact">{t("jsonMode.compact")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("hint.jsonMode")}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t("label.exportMetaSize")}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={String(exportSize)}
              onChange={(event) => {
                const next = Math.max(0, toNumber(event.target.value, exportSize));
                setExportSize(next);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("hint.exportMetaSize")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{t("hint.exportQuality")}</p>
        </>
      )}
    </div>
  );
}
