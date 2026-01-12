import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { PointGroup } from "@/lib/editor-types";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type PointGroupsCardProps = {
  t: Translate;
  pointGroups: PointGroup[];
  selectedGroupId: string | null;
  setSelectedGroupId: Dispatch<SetStateAction<string | null>>;
  newGroupName: string;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  isPointGroupsOpen: boolean;
  setIsPointGroupsOpen: Dispatch<SetStateAction<boolean>>;
  setPointGroups: Dispatch<SetStateAction<PointGroup[]>>;
  createId: () => string;
};

export function PointGroupsCard({
  t,
  pointGroups,
  selectedGroupId,
  setSelectedGroupId,
  newGroupName,
  setNewGroupName,
  isPointGroupsOpen,
  setIsPointGroupsOpen,
  setPointGroups,
  createId,
}: PointGroupsCardProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <Label>{t("label.pointGroups")}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{pointGroups.length}</Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsPointGroupsOpen((prev) => !prev)}
            aria-label={t("action.togglePointGroups")}
          >
            {isPointGroupsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {isPointGroupsOpen && (
        <>
          <div className="flex items-center gap-2">
            <Input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder={t("placeholder.groupName")}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => {
                const trimmed = newGroupName.trim();
                const name =
                  trimmed || t("group.defaultName", { index: pointGroups.length + 1 });
                const id = createId();
                setPointGroups((prev) => [...prev, { id, name, entries: [[]] }]);
                setSelectedGroupId(id);
                setNewGroupName("");
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-28 rounded-xl border border-border/50 bg-background/80">
            <div className="space-y-2 p-3">
              {pointGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {t("hint.noGroups")}
                </div>
              ) : (
                pointGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                      group.id === selectedGroupId
                        ? "border-accent/40 bg-accent/10"
                        : "border-border/60 bg-muted/30 hover:bg-muted/60"
                    )}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <div>
                      <div className="text-sm font-medium">{group.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("label.groupEntries", { count: group.entries.length })}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
