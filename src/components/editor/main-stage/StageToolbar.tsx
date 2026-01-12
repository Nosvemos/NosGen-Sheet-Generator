import type { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKey } from "@/lib/i18n";
import type { ViewMode } from "@/lib/editor-types";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type StageToolbarProps = {
  t: Translate;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  showPoints: boolean;
  setShowPoints: Dispatch<SetStateAction<boolean>>;
};

export function StageToolbar({
  t,
  viewMode,
  setViewMode,
  showGrid,
  setShowGrid,
  showPoints,
  setShowPoints,
}: StageToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList>
          <TabsTrigger value="frame">{t("tab.frame")}</TabsTrigger>
          <TabsTrigger value="atlas">{t("tab.atlas")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="grid-toggle" checked={showGrid} onCheckedChange={setShowGrid} />
          <Label htmlFor="grid-toggle">{t("label.grid")}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="points-toggle"
            checked={showPoints}
            onCheckedChange={setShowPoints}
          />
          <Label htmlFor="points-toggle">{t("label.pointsToggle")}</Label>
        </div>
      </div>
    </div>
  );
}
