"use client";

import { useCallback, useMemo, useReducer } from "react";

import type { EntitlementResult } from "@/lib/billing/entitlements-core";
import {
  clearImportDraft,
  loadImportDraft,
  saveImportDraft,
} from "@/lib/menu/import-draft";
import type { MenuImportItem, MenuImportResult } from "@/lib/menu/import-types";

export type ImportMode =
  | "upload"
  | "processing"
  | "review"
  | "saving"
  | "tier_locked";

type ImportState = {
  mode: ImportMode;
  files: File[];
  result: MenuImportResult | null;
  error: string | null;
  abortController: AbortController | null;
};

type ImportAction =
  | { type: "ADD_FILES"; files: File[]; error: string | null }
  | { type: "REMOVE_FILE"; index: number }
  | { type: "SET_ERROR"; error: string }
  | { type: "START_PROCESSING"; controller: AbortController }
  | {
      type: "FINISH_PROCESSING";
      result: MenuImportResult;
    }
  | { type: "FAIL_PROCESSING"; error: string }
  | { type: "CANCEL_PROCESSING" }
  | { type: "DISCARD" }
  | { type: "START_SAVING" };

const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // 30 MB

function reducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "ADD_FILES":
      return {
        ...state,
        files: action.files,
        error: action.error,
      };
    case "REMOVE_FILE": {
      const next = state.files.filter((_, i) => i !== action.index);
      return { ...state, files: next, error: null };
    }
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "START_PROCESSING":
      return {
        ...state,
        mode: "processing",
        error: null,
        abortController: action.controller,
      };
    case "FINISH_PROCESSING":
      return {
        ...state,
        mode: "review",
        result: action.result,
        abortController: null,
      };
    case "FAIL_PROCESSING":
      return {
        ...state,
        mode: "upload",
        error: action.error,
        abortController: null,
      };
    case "CANCEL_PROCESSING":
      return {
        ...state,
        mode: "upload",
        abortController: null,
        error: null,
      };
    case "DISCARD":
      return {
        mode: "upload",
        files: [],
        result: null,
        error: null,
        abortController: null,
      };
    case "START_SAVING":
      return { ...state, mode: "saving" };
    default:
      return state;
  }
}

function getInitialState(
  restaurantId: string,
  entitlement: EntitlementResult,
): ImportState {
  if (!entitlement.allowed) {
    return {
      mode: "tier_locked",
      files: [],
      result: null,
      error: null,
      abortController: null,
    };
  }

  const draft = loadImportDraft(restaurantId);
  if (draft) {
    return {
      mode: "review",
      files: [],
      result: draft,
      error: null,
      abortController: null,
    };
  }

  return {
    mode: "upload",
    files: [],
    result: null,
    error: null,
    abortController: null,
  };
}

export type UseMenuImportFlowOptions = {
  restaurantId: string;
  entitlement: EntitlementResult;
  existingItems: { id: string; name_bg: string; category: string }[];
};

export function useMenuImportFlow({
  restaurantId,
  entitlement,
}: UseMenuImportFlowOptions) {
  // Compute initial state once — useMemo with empty deps acts like a constant
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialState = useMemo(
    () => getInitialState(restaurantId, entitlement),
    [],
  );
  const [state, dispatch] = useReducer(reducer, initialState);

  const addFiles = useCallback(
    (incoming: File[]) => {
      // Validate each new file individually
      for (const f of incoming) {
        if (f.size > MAX_FILE_BYTES) {
          dispatch({
            type: "SET_ERROR",
            error: `Файлът «${f.name}» е по-голям от 10 MB.`,
          });
          return;
        }
      }

      // Deduplicate by name+size+lastModified
      const existing = state.files;
      const deduplicated = incoming.filter(
        (f) =>
          !existing.some(
            (e) =>
              e.name === f.name &&
              e.size === f.size &&
              e.lastModified === f.lastModified,
          ),
      );

      const merged = [...existing, ...deduplicated];

      if (merged.length > MAX_FILES) {
        dispatch({
          type: "ADD_FILES",
          files: existing,
          error: `Можеш да качиш до ${MAX_FILES} файла наведнъж.`,
        });
        return;
      }

      const totalBytes = merged.reduce((s, f) => s + f.size, 0);
      if (totalBytes > MAX_TOTAL_BYTES) {
        dispatch({
          type: "ADD_FILES",
          files: existing,
          error: "Общият размер не може да надхвърля 30 MB.",
        });
        return;
      }

      dispatch({ type: "ADD_FILES", files: merged, error: null });
    },
    [state.files],
  );

  const removeFile = useCallback((index: number) => {
    dispatch({ type: "REMOVE_FILE", index });
  }, []);

  const startExtraction = useCallback(async () => {
    if (state.files.length === 0) return;

    const controller = new AbortController();
    dispatch({ type: "START_PROCESSING", controller });

    const formData = new FormData();
    for (const file of state.files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (res.status === 402) {
        dispatch({
          type: "FAIL_PROCESSING",
          error: "Лимитът за месеца е достигнат.",
        });
        return;
      }

      if (!res.ok) {
        dispatch({
          type: "FAIL_PROCESSING",
          error: "Не успяхме да прочетем менюто. Опитай отново след малко.",
        });
        return;
      }

      const json = (await res.json()) as { result?: MenuImportResult };
      if (!json.result) {
        dispatch({
          type: "FAIL_PROCESSING",
          error: "Не успяхме да прочетем менюто. Опитай отново след малко.",
        });
        return;
      }

      saveImportDraft(restaurantId, json.result);
      dispatch({ type: "FINISH_PROCESSING", result: json.result });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // cancelProcessing() already dispatched CANCEL_PROCESSING
        return;
      }
      dispatch({
        type: "FAIL_PROCESSING",
        error: "Качването пропадна. Опитай отново.",
      });
    }
  }, [state.files, restaurantId]);

  const cancelProcessing = useCallback(() => {
    // NOTE: If the server has already started the Gemini call, the credit will
    // still be consumed. The abort only cancels the client-side fetch; the server
    // request continues running until it finishes or times out.
    state.abortController?.abort();
    dispatch({ type: "CANCEL_PROCESSING" });
  }, [state.abortController]);

  const discard = useCallback(() => {
    clearImportDraft(restaurantId);
    dispatch({ type: "DISCARD" });
  }, [restaurantId]);

  // Stubbed for Phase 3 — Phase 3 will wire this to saveMenuItems
  const commit = useCallback((_items: MenuImportItem[]) => {
    console.warn(
      "[useMenuImportFlow] commit() is not yet implemented — " +
        "Phase 3 will wire this to saveMenuItems",
    );
  }, []);

  return {
    state,
    addFiles,
    removeFile,
    startExtraction,
    cancelProcessing,
    discard,
    commit,
  };
}
