import { createContext } from "react";
import type { ToastPayload } from "@/components/ui/toast";

export type ToastContextValue = {
  pushToast: (toast: ToastPayload) => void;
  dismissToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
