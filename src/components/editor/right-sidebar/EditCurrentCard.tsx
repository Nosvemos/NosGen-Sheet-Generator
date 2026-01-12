import type { Dispatch, RefObject, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type EditCurrentCardProps = {
  t: Translate;
  editAtlasPngInputRef: RefObject<HTMLInputElement | null>;
  editAtlasJsonInputRef: RefObject<HTMLInputElement | null>;
  setEditAtlasPngFile: Dispatch<SetStateAction<File | null>>;
  setEditAtlasJsonFile: Dispatch<SetStateAction<File | null>>;
  isEditImporting: boolean;
};

export function EditCurrentCard({
  t,
  editAtlasPngInputRef,
  editAtlasJsonInputRef,
  setEditAtlasPngFile,
  setEditAtlasJsonFile,
  isEditImporting,
}: EditCurrentCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <Label>{t("label.editCurrent")}</Label>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("label.atlasPng")}</Label>
        <Input
          ref={editAtlasPngInputRef}
          type="file"
          accept="image/png"
          onChange={(event) => setEditAtlasPngFile(event.target.files?.[0] ?? null)}
          disabled={isEditImporting}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("label.atlasJson")}</Label>
        <Input
          ref={editAtlasJsonInputRef}
          type="file"
          accept="application/json"
          onChange={(event) => setEditAtlasJsonFile(event.target.files?.[0] ?? null)}
          disabled={isEditImporting}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("hint.editCurrent")}</p>
      {isEditImporting && (
        <p className="text-xs text-muted-foreground">{t("hint.importing")}</p>
      )}
    </div>
  );
}
