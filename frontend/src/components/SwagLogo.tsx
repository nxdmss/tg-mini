import { motion } from "motion/react";

type SwagLogoProps = {
  negative?: boolean;
  className?: string;
};

export function SwagLogo({
  negative = false,
  className = "",
}: SwagLogoProps) {
  return (
    <motion.span
      className={`brand__logo-mark ${className}`}
      layoutId="swag-logo"
      transition={{
        layout: {
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
    >
      <img
        className={`brand__logo-image brand__logo-image--base ${
          negative ? "is-hidden" : ""
        }`}
        src="/logo.png"
        alt="SWA6Y5TAN"
      />
      <img
        className={`brand__logo-image brand__logo-image--negative ${
          negative ? "" : "is-hidden"
        }`}
        src="/logo.png"
        alt=""
        aria-hidden="true"
      />
    </motion.span>
  );
}
