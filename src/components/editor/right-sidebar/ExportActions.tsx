import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n";
import type { PivotMode } from "@/lib/editor-types";
import { Download, Loader2 } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type ExportActionsProps = {
  t: Translate;
  framesLength: number;
  handleExportPng: () => void;
  handleExportJson: () => void;
  handleExportBundle: () => void;
  handleExportFramesZip: () => void;
  isExporting: boolean;
  pivotMode: PivotMode;
  pivotLabels: Record<PivotMode, string>;
};

export function ExportActions({
  t,
  framesLength,
  handleExportPng,
  handleExportJson,
  handleExportBundle,
  handleExportFramesZip,
  isExporting,
  pivotMode,
  pivotLabels,
}: ExportActionsProps) {
  const disabled = framesLength === 0 || isExporting;
  const renderIcon = (primary = false) =>
    isExporting && primary ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Download className="mr-2 h-4 w-4" />
    );
  return (
    <div className="space-y-2">
      <Label>{t("label.export")}</Label>
      <div className="grid gap-2">
        <Button onClick={handleExportPng} disabled={disabled}>
          {renderIcon(true)}
          {isExporting ? t("status.exporting") : t("action.exportPng")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportJson}
          disabled={disabled}
        >
          {renderIcon()}
          {t("action.exportJson")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportBundle}
          disabled={disabled}
        >
          {renderIcon()}
          {t("action.exportBundle")}
        </Button>
        <Button
          variant="outline"
          onClick={handleExportFramesZip}
          disabled={disabled}
        >
          {renderIcon()}
          {t("action.exportFramesZip")}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {t("label.pivotSpace")}: {pivotLabels[pivotMode]}
      </div>
    </div>
  );
}
