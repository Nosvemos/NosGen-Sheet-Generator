import { useCallback, useEffect, useState } from "react";
import type { Dispatch } from "react";
import type { ToastContextValue } from "@/components/ui/toast-context";
import type { TranslationKey } from "@/lib/i18n";
import {
  createInitialEditorState,
  type EditorHistoryAction,
  type EditorState,
} from "@/lib/editor-reducer";
import {
  deleteRecentProject,
  listRecentProjects,
  restoreRecentProject,
  saveRecentProject,
  type RecentProjectSummary,
} from "@/lib/recent-projects";

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

type UseRecentProjectsParams = {
  state: EditorState;
  dispatch: Dispatch<EditorHistoryAction>;
  pushToast: ToastContextValue["pushToast"];
  t: Translate;
};

export const useRecentProjects = ({
  state,
  dispatch,
  pushToast,
  t,
}: UseRecentProjectsParams) => {
  const [recentProjects, setRecentProjects] = useState<RecentProjectSummary[]>(
    []
  );

  useEffect(() => {
    let cancelled = false;
    listRecentProjects()
      .then((projects) => {
        if (!cancelled) {
          setRecentProjects(projects);
        }
      })
      .catch((error) => {
        console.warn(error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveRecentProject = useCallback(async () => {
    try {
      const projects = await saveRecentProject(state);
      setRecentProjects(projects);
      pushToast({
        title: t("status.recentProjectSavedTitle"),
        description: t("status.recentProjectSavedBody"),
      });
    } catch (error) {
      console.error(error);
      pushToast({
        variant: "warning",
        title: t("error.recentProjectFailedTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("error.recentProjectFailedBody"),
      });
    }
  }, [pushToast, state, t]);

  const handleOpenRecentProject = useCallback(
    async (id: string) => {
      try {
        const restored = await restoreRecentProject(id);
        dispatch({
          type: "reset",
          state: {
            ...createInitialEditorState(),
            theme: state.theme,
            hotkeys: state.hotkeys,
            historyLimit: state.historyLimit,
            ...restored,
          },
        });
        setRecentProjects(await listRecentProjects());
      } catch (error) {
        console.error(error);
        pushToast({
          variant: "warning",
          title: t("error.recentProjectFailedTitle"),
          description:
            error instanceof Error
              ? error.message
              : t("error.recentProjectFailedBody"),
        });
      }
    },
    [dispatch, pushToast, state.historyLimit, state.hotkeys, state.theme, t]
  );

  const handleDeleteRecentProject = useCallback(async (id: string) => {
    await deleteRecentProject(id);
    setRecentProjects(await listRecentProjects());
  }, []);

  return {
    recentProjects,
    handleSaveRecentProject,
    handleOpenRecentProject,
    handleDeleteRecentProject,
  };
};
