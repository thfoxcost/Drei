"use client";

import { useCallback, useEffect, useState } from "react";
import { REPO_ITEMS_STORAGE_KEY, getDefaultVisibility } from "../repo-items";

export function useRepoItemsVisibility() {
  // Start from "everything visible" so server-render and first client
  // paint match — reading localStorage before mount causes hydration
  // mismatches in Next.js.
  const [visibility, setVisibilityState] = useState<Record<string, boolean>>(
    getDefaultVisibility
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REPO_ITEMS_STORAGE_KEY);
      if (raw) {
        setVisibilityState((current) => ({ ...current, ...JSON.parse(raw) }));
      }
    } catch {
      // Corrupt JSON or storage disabled (private browsing, etc).
      // Fall back to the defaults already in state.
    }
  }, []);

  const setItemVisible = useCallback((id: string, visible: boolean) => {
    setVisibilityState((current) => {
      const next = { ...current, [id]: visible };
      try {
        window.localStorage.setItem(
          REPO_ITEMS_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // Storage full/disabled — UI still updates for this session.
      }
      return next;
    });
  }, []);

  return { visibility, setItemVisible };
}