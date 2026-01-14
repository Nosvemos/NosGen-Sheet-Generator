import { useEffect } from "react";
import type { HotkeyAction, HotkeyMap } from "@/lib/hotkeys";
import { formatHotkey, isEditableTarget } from "@/lib/hotkeys";

type HotkeyHandlers = Partial<Record<HotkeyAction, () => void>>;

type UseHotkeysParams = {
  hotkeys: HotkeyMap;
  handlers: HotkeyHandlers;
  enabled?: boolean;
};

export const useHotkeys = ({
  hotkeys,
  handlers,
  enabled = true,
}: UseHotkeysParams) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      const combo = formatHotkey(event);
      if (!combo) {
        return;
      }
      const entries = Object.entries(hotkeys) as Array<
        [HotkeyAction, string]
      >;
      for (const [action, value] of entries) {
        if (!value) {
          continue;
        }
        if (value === combo) {
          event.preventDefault();
          handlers[action]?.();
          break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handlers, hotkeys]);
};
