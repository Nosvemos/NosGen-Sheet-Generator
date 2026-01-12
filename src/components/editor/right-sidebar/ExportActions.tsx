import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n";
import type { PivotMode } from "@/lib/editor-types";
import { Download } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type ExportActionsProps = {
  t: Translate;
  framesLength: number;
  handleExportPng: () => void;
  handleExportJson: () => void;
  pivotMode: PivotMode;
  pivotLabels: Record<PivotMode, string>;
};

export function ExportActions({
  t,
  framesLength,
  handleExportPng,
  handleExportJson,
  pivotMode,
  pivotLabels,
}: ExportActionsProps) {
  return (
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
  );
}
