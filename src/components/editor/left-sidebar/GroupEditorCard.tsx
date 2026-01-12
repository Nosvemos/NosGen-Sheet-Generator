import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { TranslationKey } from "@/lib/i18n";
import type { PointGroup } from "@/lib/editor-types";
import { ArrowLeft, ArrowRight, Trash2, X } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type GroupEditorCardProps = {
  t: Translate;
  selectedGroup: PointGroup;
  setPointGroups: Dispatch<SetStateAction<PointGroup[]>>;
  setSelectedGroupId: Dispatch<SetStateAction<string | null>>;
  availablePoints: Array<{ id: string; name: string; color: string }>;
  groupEntrySelection: Record<string, string>;
  setGroupEntrySelection: Dispatch<SetStateAction<Record<string, string>>>;
  isGroupPreviewActive: boolean;
  setIsGroupPreviewActive: Dispatch<SetStateAction<boolean>>;
  isGroupPreviewPlaying: boolean;
  setIsGroupPreviewPlaying: Dispatch<SetStateAction<boolean>>;
  groupPreviewIndex: number;
  setGroupPreviewIndex: Dispatch<SetStateAction<number>>;
  canPreviewGroup: boolean;
};

export function GroupEditorCard({
  t,
  selectedGroup,
  setPointGroups,
  setSelectedGroupId,
  availablePoints,
  groupEntrySelection,
  setGroupEntrySelection,
  isGroupPreviewActive,
  setIsGroupPreviewActive,
  isGroupPreviewPlaying,
  setIsGroupPreviewPlaying,
  groupPreviewIndex,
  setGroupPreviewIndex,
  canPreviewGroup,
}: GroupEditorCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.groupEditor")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setPointGroups((prev) =>
              prev.filter((group) => group.id !== selectedGroup.id)
            );
            setSelectedGroupId(null);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="group-name">{t("label.groupName")}</Label>
        <Input
          id="group-name"
          value={selectedGroup.name}
          onChange={(event) => {
            const name = event.target.value;
            setPointGroups((prev) =>
              prev.map((group) =>
                group.id === selectedGroup.id ? { ...group, name } : group
              )
            );
          }}
          placeholder={t("placeholder.groupName")}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>{t("label.groupIndices")}</Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setPointGroups((prev) =>
              prev.map((group) =>
                group.id === selectedGroup.id
                  ? { ...group, entries: [...group.entries, []] }
                  : group
              )
            );
          }}
        >
          {t("action.addIndex")}
        </Button>
      </div>
      <div className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("label.groupPlayback")}</span>
          <span className="font-mono">
            {selectedGroup.entries.length > 0
              ? `${groupPreviewIndex + 1}/${selectedGroup.entries.length}`
              : "0/0"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Switch
            id="group-preview"
            checked={isGroupPreviewActive}
            onCheckedChange={(checked) => {
              setIsGroupPreviewActive(checked);
              if (!checked) {
                setIsGroupPreviewPlaying(false);
              }
            }}
          />
          <Label htmlFor="group-preview">{t("label.previewOnCanvas")}</Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canPreviewGroup}
            onClick={() => {
              if (!canPreviewGroup) {
                return;
              }
              setIsGroupPreviewActive(true);
              setIsGroupPreviewPlaying((prev) => !prev);
            }}
          >
            {isGroupPreviewPlaying
              ? t("action.stopGroup")
              : t("action.playGroup")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canPreviewGroup}
            onClick={() => {
              if (!canPreviewGroup) {
                return;
              }
              setIsGroupPreviewActive(true);
              setGroupPreviewIndex((prev) =>
                prev === 0 ? selectedGroup.entries.length - 1 : prev - 1
              );
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canPreviewGroup}
            onClick={() => {
              if (!canPreviewGroup) {
                return;
              }
              setIsGroupPreviewActive(true);
              setGroupPreviewIndex((prev) =>
                (prev + 1) % selectedGroup.entries.length
              );
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Slider
          min={0}
          max={Math.max(0, selectedGroup.entries.length - 1)}
          step={1}
          value={[groupPreviewIndex]}
          onValueChange={(value) => {
            const next = value[0] ?? 0;
            setGroupPreviewIndex(next);
            setIsGroupPreviewActive(true);
          }}
          disabled={!canPreviewGroup}
        />
      </div>
      <ScrollArea className="h-40 rounded-xl border border-border/50 bg-background/60 p-2">
        <div className="space-y-3">
          {selectedGroup.entries.map((entry, entryIndex) => (
            <div
              key={`${selectedGroup.id}-${entryIndex}`}
              className="rounded-xl border border-border/60 bg-muted/40 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("label.index")} {entryIndex}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setPointGroups((prev) =>
                      prev.map((group) =>
                        group.id === selectedGroup.id
                          ? {
                              ...group,
                              entries: group.entries.filter(
                                (_, idx) => idx !== entryIndex
                              ),
                            }
                          : group
                      )
                    );
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {availablePoints.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {t("hint.noGroupPoints")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select
                      value={
                        groupEntrySelection[`${selectedGroup.id}-${entryIndex}`] ??
                        ""
                      }
                      onValueChange={(value) => {
                        const key = `${selectedGroup.id}-${entryIndex}`;
                        setGroupEntrySelection((prev) => ({
                          ...prev,
                          [key]: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue placeholder={t("placeholder.addPoint")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePoints
                          .filter((point) => !entry.includes(point.id))
                          .map((point) => (
                            <SelectItem key={point.id} value={point.id}>
                              {point.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={
                        !(
                          groupEntrySelection[
                            `${selectedGroup.id}-${entryIndex}`
                          ] ?? ""
                        )
                      }
                      onClick={() => {
                        const key = `${selectedGroup.id}-${entryIndex}`;
                        const selectedId = groupEntrySelection[key];
                        if (!selectedId) {
                          return;
                        }
                        setPointGroups((prev) =>
                          prev.map((group) => {
                            if (group.id !== selectedGroup.id) {
                              return group;
                            }
                            const nextEntries = group.entries.map(
                              (entryPoints, idx) =>
                                idx === entryIndex
                                  ? entryPoints.includes(selectedId)
                                    ? entryPoints
                                    : [...entryPoints, selectedId]
                                  : entryPoints
                            );
                            return { ...group, entries: nextEntries };
                          })
                        );
                        setGroupEntrySelection((prev) => ({
                          ...prev,
                          [key]: "",
                        }));
                      }}
                    >
                      {t("action.addPointToIndex")}
                    </Button>
                  </div>
                )}
                {entry.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {t("hint.noPointsInIndex")}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entry.map((pointId) => {
                      const point = availablePoints.find(
                        (item) => item.id === pointId
                      );
                      return (
                        <div
                          key={pointId}
                          className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[11px]"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: point?.color || "#999" }}
                          />
                          <span>{point?.name ?? pointId}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              setPointGroups((prev) =>
                                prev.map((group) => {
                                  if (group.id !== selectedGroup.id) {
                                    return group;
                                  }
                                  const nextEntries = group.entries.map(
                                    (entryPoints, idx) =>
                                      idx === entryIndex
                                        ? entryPoints.filter(
                                            (id) => id !== pointId
                                          )
                                        : entryPoints
                                  );
                                  return { ...group, entries: nextEntries };
                                })
                              );
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
