/** SWAGYSTAN favorites live only on this browser; no customer account required. */
import { useCallback, useEffect, useState } from "react";

const KEY = "swagystan:favorites:v1";
const CHANGED = "swagystan:favorites:changed";

function readFavorites(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(readFavorites);

  useEffect(() => {
    const refresh = () => setIds(readFavorites());
    window.addEventListener(CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    const current = new Set(readFavorites());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    const next = [...current];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Keep the UI working even when storage is blocked.
    }
    setIds(next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return { ids, isFavorite, toggle };
}
