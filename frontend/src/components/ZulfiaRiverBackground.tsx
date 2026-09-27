import { useEffect, useState } from "react";

type ZulfiaRiverBackgroundProps = {
  active: boolean;
};

export function ZulfiaRiverBackground({
  active,
}: ZulfiaRiverBackgroundProps) {
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    // Restart the original animated GIF only when Zulfia is entered.
    // The image itself stays spatially fixed; only the GIF frames move.
    setPlayKey((value) => value + 1);
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="zulfia-river-bg" aria-hidden="true">
      <img
        key={playKey}
        className="zulfia-river-bg__media"
        src={`/river.gif?play=${playKey}`}
        alt=""
        loading="eager"
        decoding="async"
        draggable={false}
      />
      <span className="zulfia-river-bg__shade" />
    </div>
  );
}
