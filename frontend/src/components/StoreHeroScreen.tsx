import { useLayoutEffect, useState } from "react";
import "./StoreHeroScreen.css";

const HERO_VIDEO_SRC = "/media/swagystan-silver-glow-20261120.mp4";

type MediaMode = "video" | "placeholder";

export function StoreHeroScreen() {
  const [mode, setMode] = useState<MediaMode>("video");
  const [mediaLoaded, setMediaLoaded] = useState(false);
  useLayoutEffect(() => {
    // WebKit standalone sometimes starts with a viewport shorter than the
    // real screen and only corrects it after the first swipe.
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!ios || !standalone) return;

    const root = document.documentElement;
    root.classList.add("swag-ios-standalone");
    let frame = 0;

    const syncHeight = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = Math.ceil(Math.max(
          window.screen.height,
          window.innerHeight,
          document.documentElement.clientHeight,
          window.visualViewport?.height ?? 0,
        ));
        root.style.setProperty("--swag-iphone-screen-height", height + "px");
      });
    };

    syncHeight();
    window.addEventListener("resize", syncHeight);
    window.addEventListener("orientationchange", syncHeight);
    window.addEventListener("pageshow", syncHeight);
    window.visualViewport?.addEventListener("resize", syncHeight);
    const onVisible = () => { if (!document.hidden) syncHeight(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncHeight);
      window.removeEventListener("orientationchange", syncHeight);
      window.removeEventListener("pageshow", syncHeight);
      window.visualViewport?.removeEventListener("resize", syncHeight);
      document.removeEventListener("visibilitychange", onVisible);
      root.classList.remove("swag-ios-standalone");
      root.style.removeProperty("--swag-iphone-screen-height");
    };
  }, []);

  function useGifFallback() {
    setMediaLoaded(false);
    setMode("placeholder");
  }

  return (
    <section className={`swag-big-screen${mediaLoaded ? " swag-big-screen--loaded" : ""}`} aria-label="SWAGYSTAN campaign video">
      {mode === "video" && (
        <video
          className="swag-big-screen__media"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={() => setMediaLoaded(true)}
          onError={useGifFallback}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {mode === "placeholder" && (
        <div className="swag-big-screen__placeholder" aria-hidden="true">
          <span className="swag-big-screen__wordmark">SWAGYSTAN</span>
        </div>
      )}
    </section>
  );
}
