import type { Dispatch, SetStateAction } from "react";
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
import type { AppMode, PivotMode } from "@/lib/editor-types";
import { ChevronDown, ChevronRight } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type ProjectSettingsCardProps = {
  t: Translate;
  isProjectSettingsOpen: boolean;
  setIsProjectSettingsOpen: Dispatch<SetStateAction<boolean>>;
  appMode: AppMode;
  setAppMode: Dispatch<SetStateAction<AppMode>>;
  projectName: string;
  setProjectName: Dispatch<SetStateAction<string>>;
  pivotMode: PivotMode;
  setPivotMode: Dispatch<SetStateAction<PivotMode>>;
  pivotLabels: Record<PivotMode, string>;
  pivotOptions: PivotMode[];
};

export function ProjectSettingsCard({
  t,
  isProjectSettingsOpen,
  setIsProjectSettingsOpen,
  appMode,
  setAppMode,
  projectName,
  setProjectName,
  pivotMode,
  setPivotMode,
  pivotLabels,
  pivotOptions,
}: ProjectSettingsCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.projectSettings")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsProjectSettingsOpen((prev) => !prev)}
          aria-label={t("action.toggleProjectSettings")}
        >
          {isProjectSettingsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isProjectSettingsOpen && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.appMode")}
            </Label>
            <Select
              value={appMode}
              onValueChange={(value) => setAppMode(value as AppMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("label.appMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="character">{t("mode.character")}</SelectItem>
                <SelectItem value="animation">{t("mode.animation")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("hint.appMode")}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="project-name">{t("label.projectName")}</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder={t("placeholder.projectName")}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.pivotSpace")}
            </Label>
            <Select
              value={pivotMode}
              onValueChange={(value) => setPivotMode(value as PivotMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("placeholder.pivotMode")} />
              </SelectTrigger>
              <SelectContent>
                {pivotOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {pivotLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("hint.pivotExport")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
