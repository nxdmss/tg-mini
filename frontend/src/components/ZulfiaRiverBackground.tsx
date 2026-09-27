import { useState } from "react";

type ZulfiaRiverBackgroundProps = {
  active: boolean;
};

const ANIMATED_RIVER_SRC =
  "https://giffiles.alphacoders.com/223/223620.gif";

export function ZulfiaRiverBackground({
  active,
}: ZulfiaRiverBackgroundProps) {
  const [failed, setFailed] = useState(false);

  if (!active) {
    return null;
  }

  return (
    <div className="zulfia-river-bg" aria-hidden="true">
      <img
        className="zulfia-river-bg__media"
        src={failed ? "/river.gif" : ANIMATED_RIVER_SRC}
        alt=""
        loading="eager"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />

      <span className="zulfia-river-bg__shade" />
    </div>
  );
}
