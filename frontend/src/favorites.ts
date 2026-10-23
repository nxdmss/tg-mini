import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "swagystan:favorites:v1";
const CHANGE_EVENT = "swagystan:favorites:changed";

function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(read);
  useEffect(() => {
    const refresh = () => setIds(read());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    const next = new Set(read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const values = [...next];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // UI still updates when private browsing blocks storage.
    }
    setIds(values);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { ids, isFavorite, toggle };
}
