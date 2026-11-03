import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import "./StoreIntro.css";

const SEEN_KEY = "swagystan:intro:seen:v2";
const MIN_DURATION_MS = 1350;
const MAX_DURATION_MS = 4000;
const EXIT_DURATION_MS = 740;

type Phase = "show" | "leaving" | "done";

export function wasIntroSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Use the original SWAG logo; allow first-row images to load behind it.
 * Never block the storefront indefinitely if the network is down.
 */
export function StoreIntro({
  catalogLoading,
  onReveal,
}: {
  catalogLoading: boolean;
  onReveal: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(() => wasIntroSeen() ? "done" : "show");
  const startedAt = useRef(Date.now());
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (phase !== "show") return;

    let cancelled = false;
    let minTimer: number | undefined;
    let frame: number | undefined;
    const cleanups: Array<() => void> = [];
    const timeout = window.setTimeout(() => setPhase("leaving"),
      Math.max(0, MAX_DURATION_MS - (Date.now() - startedAt.current)));

    if (!catalogLoading) {
      // After the React render, wait for the first visible product images.
      frame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        const firstImages = Array.from(
          document.querySelectorAll<HTMLImageElement>(
            ".store-experience__catalog .card__media .card__image--primary",
          ),
        ).slice(0, 4);

        const imageLoads = firstImages
          .filter((img) => !img.complete)
          .map((img) => new Promise<void>((resolve) => {
            const finish = () => {
              img.removeEventListener("load", finish);
              img.removeEventListener("error", finish);
              resolve();
            };
            img.addEventListener("load", finish);
            img.addEventListener("error", finish);
            cleanups.push(() => {
              img.removeEventListener("load", finish);
              img.removeEventListener("error", finish);
            });
            if (img.complete) finish();
          }));

        void Promise.all(imageLoads).then(() => {
          if (cancelled) return;
          minTimer = window.setTimeout(() => setPhase("leaving"),
            Math.max(0, MIN_DURATION_MS - (Date.now() - startedAt.current)));
        });
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (minTimer !== undefined) window.clearTimeout(minTimer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [catalogLoading, phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* Private browsing. */ }
    onReveal();
    const timer = window.setTimeout(() => setPhase("done"),
      reducedMotion ? 40 : EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onReveal, phase, reducedMotion]);

  if (phase === "done") return null;

  const leaving = phase === "leaving";
  return (
    <motion.div
      className={`swag-intro${leaving ? " swag-intro--leaving" : ""}`}
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : leaving ? 0.72 : 0.1, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <div className="swag-intro__mark">
        <motion.img
          className="swag-intro__logo"
          src="/logo.png"
          alt=""
          draggable={false}
          fetchPriority="high"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 14, filter: "blur(12px)" }}
          animate={leaving
            ? { opacity: 0, scale: 1.06, y: -9, filter: "blur(7px)" }
            : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reducedMotion ? 0 : leaving ? 0.45 : 0.67, ease: [0.16, 1, 0.3, 1] }}
        />
        <img className="swag-intro__glitch swag-intro__glitch--a"
          src="/logo.png" alt="" draggable={false} />
        <img className="swag-intro__glitch swag-intro__glitch--b"
          src="/logo.png" alt="" draggable={false} />
      </div>
      <span className="swag-intro__static" />
      <span className="swag-intro__scanline" />
    </motion.div>
  );
}
