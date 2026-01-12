import { Layers } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type RightSidebarHeaderProps = {
  t: Translate;
};

export function RightSidebarHeader({ t }: RightSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t("panel.importExport")}
        </p>
        <h2 className="text-lg font-semibold">{t("panel.pipeline")}</h2>
      </div>
      <Layers className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
