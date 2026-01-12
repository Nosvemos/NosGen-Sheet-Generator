import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { TranslationKey } from "@/lib/i18n";
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
  );
}
