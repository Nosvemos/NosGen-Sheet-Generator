import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";
import { Settings } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type LeftSidebarHeaderProps = {
  t: Translate;
  framesLength: number;
  currentFrameIndex: number;
  onOpenSettings: () => void;
};

export function LeftSidebarHeader({
  t,
  framesLength,
  currentFrameIndex,
  onOpenSettings,
}: LeftSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t("label.tools")}
        </p>
        <h2 className="text-lg font-semibold">{t("panel.tools")}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {framesLength ? `${currentFrameIndex + 1}/${framesLength}` : "0"}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onOpenSettings}
          aria-label={t("action.toggleSettings")}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
