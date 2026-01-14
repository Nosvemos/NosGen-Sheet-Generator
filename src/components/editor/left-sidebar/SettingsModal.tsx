import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";
import type { HotkeyMap } from "@/lib/hotkeys";
import { SettingsCard } from "@/components/editor/left-sidebar/SettingsCard";
import { X } from "lucide-react";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type SettingsModalProps = {
  t: Translate;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  historyLimit: number;
  setHistoryLimit: Dispatch<SetStateAction<number>>;
  hotkeys: HotkeyMap;
  setHotkeys: Dispatch<SetStateAction<HotkeyMap>>;
  onResetHotkeys: () => void;
  toNumber: (value: string, fallback: number) => number;
};

export function SettingsModal({
  t,
  isOpen,
  onOpenChange,
  historyLimit,
  setHistoryLimit,
  hotkeys,
  setHotkeys,
  onResetHotkeys,
  toNumber,
}: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("label.settings")}
            </p>
            <h3 className="text-lg font-semibold">{t("label.settings")}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onOpenChange(false)}
            aria-label={t("action.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <SettingsCard
            t={t}
            isSettingsOpen={isOpen}
            setIsSettingsOpen={(value) =>
              onOpenChange(typeof value === "function" ? value(isOpen) : value)
            }
            historyLimit={historyLimit}
            setHistoryLimit={setHistoryLimit}
            hotkeys={hotkeys}
            setHotkeys={setHotkeys}
            onResetHotkeys={onResetHotkeys}
            toNumber={toNumber}
            variant="modal"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
