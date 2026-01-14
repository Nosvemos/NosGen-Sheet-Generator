import { useEffect, useRef } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { AppMode } from "@/lib/editor-types";
import { useToast } from "@/components/ui/toast";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type UseValidationAlertsParams = {
  t: Translate;
  framesLength: number;
  sizeMismatch: boolean;
  unassignedPointsCount: number;
  appMode: AppMode;
};

export const useValidationAlerts = ({
  t,
  framesLength,
  sizeMismatch,
  unassignedPointsCount,
  appMode,
}: UseValidationAlertsParams) => {
  const { pushToast } = useToast();
  const previousRef = useRef({
    framesLength,
    sizeMismatch,
    unassignedPointsCount,
  });

  useEffect(() => {
    const prev = previousRef.current;
    if (framesLength === 0 && prev.framesLength > 0) {
      pushToast({
        variant: "warning",
        title: t("warn.missingFramesTitle"),
        description: t("warn.missingFramesBody"),
      });
    }
    if (sizeMismatch && !prev.sizeMismatch) {
      pushToast({
        variant: "warning",
        title: t("warn.sizeMismatchTitle"),
        description: t("warn.sizeMismatchBody"),
      });
    }
    if (
      appMode === "character" &&
      unassignedPointsCount > 0 &&
      prev.unassignedPointsCount === 0
    ) {
      pushToast({
        variant: "warning",
        title: t("warn.unassignedPointsTitle"),
        description: t("warn.unassignedPointsBody", {
          count: unassignedPointsCount,
        }),
      });
    }
    previousRef.current = { framesLength, sizeMismatch, unassignedPointsCount };
  }, [
    appMode,
    framesLength,
    sizeMismatch,
    t,
    unassignedPointsCount,
    pushToast,
  ]);
};
