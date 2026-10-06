import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../cart";
import { tg } from "../telegram";
import { isTelegram } from "../platform";
import { CartIcon } from "./CartIcon";

import "./Header.css";

type HeaderProps = {
  onCartClick: () => void;
  homePath?: string;
  logoNegative?: boolean;
  logoPosition?: "left" | "center";
};

export function Header({
  onCartClick,
  homePath = "/",
  logoNegative = false,
  logoPosition = "left",
}: HeaderProps) {
  const { count } = useCart();
  const navigate = useNavigate();
  const lastLogoTap = useRef(0);
  const telegramMode = isTelegram();
  const reducedMotion = useReducedMotion();

  function handleLogoClick() {
    if (!telegramMode) {
      navigate(homePath);
      return;
    }

    const now = Date.now();
    if (now - lastLogoTap.current < 450) {
      try {
        tg.HapticFeedback?.impactOccurred?.("light");
      } catch {
        // Not running inside Telegram.
      }
      navigate("/admin");
      lastLogoTap.current = 0;
      return;
    }

    lastLogoTap.current = now;
  }

  return (
    <header className="header">
      <motion.div
        layout
        className={`container header__inner header__inner--store header__inner--logo-${logoPosition}`}
        transition={{
          layout: {
            duration: reducedMotion ? 0 : 0.62,
            ease: [0.16, 1, 0.3, 1],
          },
        }}
      >
        <motion.button
          layout
          className={`brand__logo ${logoNegative ? "brand__logo--negative" : ""}`}
          transition={{
            layout: {
              duration: reducedMotion ? 0 : 0.62,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          type="button"
          onClick={handleLogoClick}
          aria-label="SWAGYSTAN"
        >
          <span className="brand__logo-mark">
            <img
              className="brand__logo-image brand__logo-image--base"
              src="/logo.png"
              alt="SWAGYSTAN"
            />
            <img
              className="brand__logo-image brand__logo-image--negative"
              src="/logo.png"
              alt=""
              aria-hidden="true"
            />
          </span>
        </motion.button>

        <div className="header__actions">
          <button
            type="button"
            className="header-action header-cart"
            onClick={onCartClick}
            aria-label="Открыть покупки"
          >
            <CartIcon count={count} />
          </button>
        </div>
      </motion.div>
    </header>
  );
}
