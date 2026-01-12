import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TranslationKey } from "@/lib/i18n";
import type { AtlasLayout, FrameData, ThemeMode } from "@/lib/editor-types";
import { Moon, Sparkles, Sun } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type MainStageHeaderProps = {
  t: Translate;
  theme: ThemeMode;
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
  currentFrame?: FrameData;
  atlasLayout: AtlasLayout;
};

export function MainStageHeader({
  t,
  theme,
  setTheme,
  currentFrame,
  atlasLayout,
}: MainStageHeaderProps) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {t("app.kicker")}
          </div>
          <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {currentFrame
              ? t("status.frameSize", {
                  w: currentFrame.width,
                  h: currentFrame.height,
                })
              : t("status.noFrame")}
          </Badge>
          <Badge variant="outline" className="font-mono">
            {t("status.atlasSize", {
              w: atlasLayout.width,
              h: atlasLayout.height,
            })}
          </Badge>
          <Badge variant="secondary">
            {t("status.rows", { rows: atlasLayout.rows })}
          </Badge>
          <Badge variant="secondary">
            {t("status.columns", { columns: atlasLayout.columns })}
          </Badge>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as ThemeMode)}
            >
              <SelectTrigger
                className="h-8 w-[110px] border-0 bg-transparent px-0 text-xs shadow-none ring-0 ring-offset-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label={t("label.theme")}
              >
                <SelectValue placeholder={t("label.theme")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("theme.dark")}</SelectItem>
                <SelectItem value="light">{t("theme.light")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
