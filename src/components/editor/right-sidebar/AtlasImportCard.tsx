import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKey } from "@/lib/i18n";
import { Plus, Trash2 } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type ImportMode = "new" | "edit";

type AtlasImportCardProps = {
  t: Translate;
  framesLength: number;
  framesInputRef: RefObject<HTMLInputElement | null>;
  newPointsInputRef: RefObject<HTMLInputElement | null>;
  appendFramesInputRef: RefObject<HTMLInputElement | null>;
  handleNewAtlasCreate: () => Promise<void> | void;
  handleAppendFrames: () => Promise<void> | void;
  handleNewPointsImport: (file: File) => Promise<void> | void;
  onClearFrames: () => void;
  editAtlasPngInputRef: RefObject<HTMLInputElement | null>;
  editAtlasJsonInputRef: RefObject<HTMLInputElement | null>;
  setEditAtlasPngFile: Dispatch<SetStateAction<File | null>>;
  setEditAtlasJsonFile: Dispatch<SetStateAction<File | null>>;
  isEditImporting: boolean;
  hasEditImport: boolean;
};

export function AtlasImportCard({
  t,
  framesLength,
  framesInputRef,
  newPointsInputRef,
  appendFramesInputRef,
  handleNewAtlasCreate,
  handleAppendFrames,
  handleNewPointsImport,
  onClearFrames,
  editAtlasPngInputRef,
  editAtlasJsonInputRef,
  setEditAtlasPngFile,
  setEditAtlasJsonFile,
  isEditImporting,
  hasEditImport,
}: AtlasImportCardProps) {
  const [mode, setMode] = useState<ImportMode>("new");

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <Label>{t("label.atlasImport")}</Label>
      <Input
        ref={appendFramesInputRef}
        type="file"
        accept="image/png"
        multiple
        className="hidden"
        hidden
        onChange={(event) => {
          if (event.target.files?.length) {
            void handleAppendFrames();
          }
        }}
      />
      <Tabs value={mode} onValueChange={(value) => setMode(value as ImportMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">{t("label.newAtlas")}</TabsTrigger>
          <TabsTrigger value="edit">{t("label.editCurrent")}</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.pngFrames")}
            </Label>
            <Input
              ref={framesInputRef}
              type="file"
              accept="image/png"
              multiple
              onChange={(event) => {
                if (event.target.files?.length) {
                  void handleNewAtlasCreate();
                }
              }}
            />
            <div className="text-xs text-muted-foreground">
              {t("hint.fileOrder")}
            </div>
            {framesLength > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => appendFramesInputRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("action.addFrames")}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.pointsJson")}
            </Label>
            <Input
              ref={newPointsInputRef}
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleNewPointsImport(file);
                }
              }}
            />
            <div className="text-xs text-muted-foreground">
              {t("hint.pointsOptional")}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onClearFrames}
            disabled={framesLength === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("action.clearFrames")}
          </Button>
        </TabsContent>
        <TabsContent value="edit" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.atlasPng")}
            </Label>
            <Input
              ref={editAtlasPngInputRef}
              type="file"
              accept="image/png"
              onChange={(event) =>
                setEditAtlasPngFile(event.target.files?.[0] ?? null)
              }
              disabled={isEditImporting}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.atlasJson")}
            </Label>
            <Input
              ref={editAtlasJsonInputRef}
              type="file"
              accept="application/json"
              onChange={(event) =>
                setEditAtlasJsonFile(event.target.files?.[0] ?? null)
              }
              disabled={isEditImporting}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("hint.editCurrent")}</p>
          {hasEditImport && framesLength > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => appendFramesInputRef.current?.click()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("action.addFrames")}
            </Button>
          )}
          {isEditImporting && (
            <p className="text-xs text-muted-foreground">
              {t("hint.importing")}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
