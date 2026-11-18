import { useState } from "react";
import "./StoreHeroScreen.css";

const HERO_GIF_SRC = "/media/swagystan-hero.gif";

export function StoreHeroScreen() {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  return (
    <section
      className={`swag-big-screen${mediaLoaded ? " swag-big-screen--loaded" : ""}`}
      aria-label="SWAGYSTAN media screen"
    >
      <img
        className="swag-big-screen__image"
        src={HERO_GIF_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
        fetchPriority="high"
        onLoad={() => setMediaLoaded(true)}
        onError={() => setMediaLoaded(false)}
      />
      {!mediaLoaded && (
        <div className="swag-big-screen__placeholder" aria-hidden="true">
          <span className="swag-big-screen__wordmark">SWAGYSTAN</span>
          <span className="swag-big-screen__spec">MEDIA / 16:9 / 1920 × 1080</span>
        </div>
      )}
    </section>
  );
}
