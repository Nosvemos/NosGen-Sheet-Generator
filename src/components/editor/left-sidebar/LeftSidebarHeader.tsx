import { Badge } from "@/components/ui/badge";
import type { TranslationKey } from "@/lib/i18n";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type LeftSidebarHeaderProps = {
  t: Translate;
  framesLength: number;
  currentFrameIndex: number;
};

export function LeftSidebarHeader({
  t,
  framesLength,
  currentFrameIndex,
}: LeftSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t("label.tools")}
        </p>
        <h2 className="text-lg font-semibold">{t("panel.tools")}</h2>
      </div>
      <Badge variant="secondary">
        {framesLength ? `${currentFrameIndex + 1}/${framesLength}` : "0"}
      </Badge>
    </div>
  );
}
