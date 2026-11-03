import { useEffect, useRef, useState } from "react";
import "./StoreIntro.css";

const SEEN_KEY = "swagystan:intro:seen:v1";
const MIN_DURATION_MS = 1050;
const MAX_DURATION_MS = 3800;
const FADE_DURATION_MS = 260;

type Phase = "show" | "leave" | "done";

function initialPhase(): Phase {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1" ? "done" : "show";
  } catch {
    return "show";
  }
}

/**
 * Show the existing SWAG logo once per browser tab.
 * Wait at least a second and until the catalog + first-row images are ready,
 * but never hold the screen indefinitely on slow or blocked networks.
 */
export function StoreIntro({ catalogLoading }: { catalogLoading: boolean }) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (phase !== "show") return;

    let cancelled = false;
    let minimumTimer: number | undefined;
    const timeout = window.setTimeout(
      () => setPhase("leave"),
      Math.max(0, MAX_DURATION_MS - (Date.now() - startedAt.current)),
    );
    const cleanups: Array<() => void> = [];

    if (!catalogLoading) {
      // The first four catalog images already use eager loading in ProductCard.
      const firstImages = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          ".store-experience__catalog .card__media .card__image--primary",
        ),
      ).slice(0, 4);

      const imageLoads = firstImages
        .filter((image) => !image.complete)
        .map((image) => new Promise<void>((resolve) => {
          const finish = () => {
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
          };
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
          cleanups.push(() => {
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
          });
        }));

      void Promise.all(imageLoads).then(() => {
        if (cancelled) return;
        minimumTimer = window.setTimeout(
          () => setPhase("leave"),
          Math.max(0, MIN_DURATION_MS - (Date.now() - startedAt.current)),
        );
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (minimumTimer !== undefined) window.clearTimeout(minimumTimer);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [catalogLoading, phase]);

  useEffect(() => {
    if (phase !== "leave") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* Private mode. */ }
    const timer = window.setTimeout(() => setPhase("done"), FADE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;
  return (
    <div className={`swag-intro${phase === "leave" ? " swag-intro--leaving" : ""}`} aria-hidden="true">
      <img className="swag-intro__logo" src="/logo.png" alt="" fetchPriority="high" />
    </div>
  );
}
