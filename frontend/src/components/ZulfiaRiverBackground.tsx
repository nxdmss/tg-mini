import { useEffect, useState } from "react";

type ZulfiaRiverBackgroundProps = {
  active: boolean;
};

export function ZulfiaRiverBackground({
  active,
}: ZulfiaRiverBackgroundProps) {
  const [src, setSrc] = useState("/river.gif");

  useEffect(() => {
    if (!active) {
      return;
    }

    // A fresh URL forces WebView/Safari/Telegram to restart the GIF
    // instead of reusing a paused background-image frame from cache.
    setSrc(`/river.gif?play=${Date.now()}`);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="zulfia-river-bg" aria-hidden="true">
      <img
        key={src}
        className="zulfia-river-bg__media"
        src={src}
        alt=""
        decoding="async"
        draggable={false}
      />
      <span className="zulfia-river-bg__shade" />
    </div>
  );
}
