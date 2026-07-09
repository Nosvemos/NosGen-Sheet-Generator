import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKey } from "@/lib/i18n";
import type { RecentProjectSummary } from "@/lib/recent-projects";
import { ATLAS_IMAGE_ACCEPT } from "@/lib/texture-codecs";
import { Clock, FolderOpen, Plus, Save, Trash2 } from "lucide-react";

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
  recentProjects: RecentProjectSummary[];
  onSaveRecentProject: () => Promise<void> | void;
  onOpenRecentProject: (id: string) => Promise<void> | void;
  onDeleteRecentProject: (id: string) => Promise<void> | void;
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
  recentProjects,
  onSaveRecentProject,
  onOpenRecentProject,
  onDeleteRecentProject,
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
        accept={ATLAS_IMAGE_ACCEPT}
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
              accept={ATLAS_IMAGE_ACCEPT}
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
              accept={ATLAS_IMAGE_ACCEPT}
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
      <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {t("label.recentProjects")}
          </Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void onSaveRecentProject()}
            disabled={framesLength === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {t("action.saveRecentProject")}
          </Button>
        </div>
        {recentProjects.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("hint.noRecentProjects")}
          </p>
        ) : (
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/60 px-2 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium" title={project.name}>
                    {project.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("status.recentProjectMeta", {
                      count: project.frameCount,
                      mode: project.appMode,
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void onOpenRecentProject(project.id)}
                    aria-label={t("action.openRecentProject")}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void onDeleteRecentProject(project.id)}
                    aria-label={t("action.deleteRecentProject")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t("hint.recentProjects")}
        </p>
      </div>
    </div>
  );
}
