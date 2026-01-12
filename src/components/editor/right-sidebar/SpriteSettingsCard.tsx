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
import type { TranslationKey } from "@/lib/i18n";
import type { SpriteDirection } from "@/lib/editor-types";
import { ChevronDown, ChevronRight } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type SpriteSettingsCardProps = {
  t: Translate;
  isSpriteSettingsOpen: boolean;
  setIsSpriteSettingsOpen: Dispatch<SetStateAction<boolean>>;
  spriteDirection: SpriteDirection;
  setSpriteDirection: Dispatch<SetStateAction<SpriteDirection>>;
};

export function SpriteSettingsCard({
  t,
  isSpriteSettingsOpen,
  setIsSpriteSettingsOpen,
  spriteDirection,
  setSpriteDirection,
}: SpriteSettingsCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.spriteSettings")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsSpriteSettingsOpen((prev) => !prev)}
          aria-label={t("action.toggleSpriteSettings")}
        >
          {isSpriteSettingsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isSpriteSettingsOpen && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.spriteDirection")}
            </Label>
            <Select
              value={spriteDirection}
              onValueChange={(value) =>
                setSpriteDirection(value as SpriteDirection)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("label.spriteDirection")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clockwise">{t("direction.clockwise")}</SelectItem>
                <SelectItem value="counterclockwise">
                  {t("direction.counterclockwise")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{t("hint.spriteSettings")}</p>
        </>
      )}
    </div>
  );
}
