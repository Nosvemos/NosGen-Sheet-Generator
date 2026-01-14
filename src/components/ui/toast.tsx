import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createId } from "@/lib/editor-helpers";

export type ToastVariant = "info" | "warning" | "success";

export type ToastPayload = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastEntry = ToastPayload & {
  id: string;
};

type ToastContextValue = {
  pushToast: (toast: ToastPayload) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-sky-400/40 bg-sky-500/10 text-sky-50",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-50",
  success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-50",
};

const VARIANT_ICONS: Record<ToastVariant, typeof AlertTriangle> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (toast: ToastPayload) => {
      const id = createId();
      setToasts((prev) => [...prev, { id, ...toast }].slice(-4));
      const timeout = window.setTimeout(() => dismissToast(id), 4200);
      timeoutsRef.current.set(id, timeout);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ pushToast, dismissToast }),
    [dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[70] flex w-[340px] flex-col gap-3">
          {toasts.map((toast) => {
            const variant = toast.variant ?? "info";
            const Icon = VARIANT_ICONS[variant];
            return (
              <div
                key={toast.id}
                className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${VARIANT_STYLES[variant]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="text-sm font-semibold">{toast.title}</p>
                      {toast.description && (
                        <p className="text-xs text-slate-200/80">
                          {toast.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-200/80 hover:text-slate-50"
                    onClick={() => dismissToast(toast.id)}
                    aria-label="Dismiss toast"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
