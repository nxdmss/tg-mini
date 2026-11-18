import { useState } from "react";
import "./StoreHeroScreen.css";

const HERO_VIDEO_SRC = "/media/swagystan-hero.mp4";
const HERO_GIF_FALLBACK = "/media/swagystan-hero.gif";

type MediaMode = "video" | "gif" | "placeholder";

export function StoreHeroScreen() {
  const [mode, setMode] = useState<MediaMode>("video");
  const [mediaLoaded, setMediaLoaded] = useState(false);

  function useGifFallback() {
    setMediaLoaded(false);
    setMode("gif");
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

      {mode === "gif" && (
        <img
          className="swag-big-screen__media"
          src={HERO_GIF_FALLBACK}
          alt=""
          aria-hidden="true"
          draggable={false}
          fetchPriority="high"
          onLoad={() => setMediaLoaded(true)}
          onError={() => setMode("placeholder")}
        />
      )}

      {mode === "placeholder" && (
        <div className="swag-big-screen__placeholder" aria-hidden="true">
          <span className="swag-big-screen__wordmark">SWAGYSTAN</span>
        </div>
      )}
    </section>
  );
}
