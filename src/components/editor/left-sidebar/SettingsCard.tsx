import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranslationKey } from "@/lib/i18n";
import type { HotkeyAction, HotkeyMap } from "@/lib/hotkeys";
import { DEFAULT_HOTKEYS, formatHotkey } from "@/lib/hotkeys";
import { ChevronDown, ChevronRight, RotateCcw, Trash2, X } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type SettingsCardProps = {
  t: Translate;
  isSettingsOpen: boolean;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  historyLimit: number;
  setHistoryLimit: Dispatch<SetStateAction<number>>;
  hotkeys: HotkeyMap;
  setHotkeys: Dispatch<SetStateAction<HotkeyMap>>;
  onResetHotkeys: () => void;
  historyEntries: string[];
  undoCount: number;
  redoCount: number;
  onClearHistory: () => void;
  toNumber: (value: string, fallback: number) => number;
  variant?: "panel" | "modal";
};

const HOTKEY_ACTIONS: Array<{ id: HotkeyAction; label: TranslationKey }> = [
  { id: "undo", label: "hotkey.undo" },
  { id: "redo", label: "hotkey.redo" },
  { id: "playPause", label: "hotkey.playPause" },
  { id: "prevFrame", label: "hotkey.prevFrame" },
  { id: "nextFrame", label: "hotkey.nextFrame" },
  { id: "firstFrame", label: "hotkey.firstFrame" },
  { id: "lastFrame", label: "hotkey.lastFrame" },
  { id: "toggleGrid", label: "hotkey.toggleGrid" },
  { id: "togglePoints", label: "hotkey.togglePoints" },
  { id: "selectMode", label: "hotkey.selectMode" },
  { id: "addMode", label: "hotkey.addMode" },
  { id: "addPoint", label: "hotkey.addPoint" },
  { id: "deletePoint", label: "hotkey.deletePoint" },
  { id: "selectPrevPoint", label: "hotkey.selectPrevPoint" },
  { id: "selectNextPoint", label: "hotkey.selectNextPoint" },
];

export function SettingsCard({
  t,
  isSettingsOpen,
  setIsSettingsOpen,
  historyLimit,
  setHistoryLimit,
  hotkeys,
  setHotkeys,
  onResetHotkeys,
  historyEntries,
  undoCount,
  redoCount,
  onClearHistory,
  toNumber,
  variant = "panel",
}: SettingsCardProps) {
  const isModal = variant === "modal";
  const isExpanded = isModal ? true : isSettingsOpen;
  const handleHotkeyChange = (
    action: HotkeyAction,
    nextValue: string
  ) => {
    setHotkeys((prev) => ({ ...prev, [action]: nextValue }));
  };

  return (
    <div
      className={
        isModal
          ? "space-y-4"
          : "space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3"
      }
    >
      {!isModal && (
        <div className="flex items-center justify-between">
          <Label>{t("label.settings")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            aria-label={t("action.toggleSettings")}
          >
            {isSettingsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      {isExpanded && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("label.historyLimit")}
            </Label>
            <Input
              type="number"
              min={0}
              max={500}
              value={String(historyLimit)}
              onChange={(event) => {
                const next = Math.max(0, toNumber(event.target.value, historyLimit));
                setHistoryLimit(next);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("hint.historyLimit")}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                {t("label.historySnapshots")}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                disabled={undoCount === 0 && redoCount === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("action.clearHistory")}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("status.historyCounts", {
                undo: undoCount,
                redo: redoCount,
              })}
            </div>
            {historyEntries.length > 0 ? (
              <div className="space-y-1">
                {historyEntries.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="text-xs text-muted-foreground">
                    {entry}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("hint.noHistory")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("hint.historySnapshots")}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                {t("label.hotkeys")}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetHotkeys}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("action.resetHotkeys")}
              </Button>
            </div>
            <div className="space-y-2">
              <ScrollArea
                type="always"
                className="h-52 rounded-lg border border-border/50 bg-background/40 p-2"
              >
                <div className="space-y-2 pr-2">
                  {HOTKEY_ACTIONS.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Label className="text-xs text-muted-foreground">
                        {t(action.label)}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          data-hotkey-input
                          readOnly
                          value={hotkeys[action.id] ?? ""}
                          placeholder={t("placeholder.hotkey")}
                          className="w-36 text-xs"
                          onKeyDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (event.key === "Escape") {
                              (event.currentTarget as HTMLInputElement).blur();
                              return;
                            }
                            if (event.key === "Backspace" || event.key === "Delete") {
                              handleHotkeyChange(action.id, "");
                              return;
                            }
                            const combo = formatHotkey(event);
                            if (!combo) {
                              return;
                            }
                            handleHotkeyChange(action.id, combo);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleHotkeyChange(action.id, "")}
                          aria-label={t("action.clearHotkey")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("hint.hotkeysCapture")}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
            {t("hint.hotkeysDefaults", {
              undo: DEFAULT_HOTKEYS.undo,
              redo: DEFAULT_HOTKEYS.redo,
            })}
          </div>
        </>
      )}
    </div>
  );
}
