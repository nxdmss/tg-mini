import { useEffect, useRef, useState } from "react";
import "./StoreHeroScreen.css";

const HERO_VIDEO_SRC = "/media/swagystan-silver-glow-20261120.mp4";

type MediaMode = "video" | "placeholder";

export function StoreHeroScreen({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      if (!active || document.hidden) { video.pause(); return; }
      if (video.paused) void video.play().catch(() => {});
    };
    const timer = active ? undefined : window.setTimeout(() => video.pause(), 550);
    if (active) play();
    video.addEventListener("canplay", play);
    window.addEventListener("pageshow", play);
    document.addEventListener("visibilitychange", play);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      video.removeEventListener("canplay", play);
      window.removeEventListener("pageshow", play);
      document.removeEventListener("visibilitychange", play);
    };
  }, [active]);
  const [mode, setMode] = useState<MediaMode>("video");
  const [mediaLoaded, setMediaLoaded] = useState(false);
  function useGifFallback() {
    setMediaLoaded(false);
    setMode("placeholder");
  }

  return (
    <section className={`swag-big-screen${mediaLoaded ? " swag-big-screen--loaded" : ""}`} aria-label="SWAGYSTAN campaign video">
      {mode === "video" && (
        <video
          className="swag-big-screen__media"
          style={{ pointerEvents: "none" }}
          ref={videoRef}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          autoPlay={active}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={() => setMediaLoaded(true)}
          onPlaying={() => setMediaLoaded(true)}
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
