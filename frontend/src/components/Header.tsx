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
  landing?: boolean;
  showCart?: boolean;
  onLogoClick?: () => void;
  gridColumns?: 3 | 6;
  onGridColumnsChange?: (columns: 3 | 6) => void;
  navItems?: Array<{
    id: string;
    title: string;
    active: boolean;
    onSelect: () => void;
  }>;
};

export function Header({
  onCartClick,
  homePath = "/",
  logoNegative = false,
  logoPosition = "left",
  landing = false,
  showCart = true,
  onLogoClick,
  navItems,
  gridColumns,
  onGridColumnsChange,
}: HeaderProps) {
  const { count } = useCart();
  const navigate = useNavigate();
  const lastLogoTap = useRef(0);
  const telegramMode = isTelegram();
  const reducedMotion = useReducedMotion();

  function handleLogoClick() {
    if (!telegramMode) {
      if (onLogoClick) onLogoClick();
      else navigate(homePath);
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
    onLogoClick?.();
  }

  return (
    <header className={`header${landing ? " header--landing" : ""}`}>
      <motion.div
        layout
        className={`container header__inner header__inner--store header__inner--logo-${logoPosition}`}
        transition={{
          layout: {
            duration: reducedMotion ? 0 : 1.25,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
      >
        <motion.button
          layout
          className={`brand__logo ${logoNegative ? "brand__logo--negative" : ""}`}
          transition={{
            layout: {
              duration: reducedMotion ? 0 : 1.25,
              ease: [0.22, 1, 0.36, 1],
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

        {navItems && navItems.length > 0 && (
          <nav className="swag-nav swag-nav--header" aria-label="Навигация магазина">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`swag-nav__tab ${item.active ? "is-active" : ""}`}
                onClick={item.onSelect}
                aria-current={item.active ? "page" : undefined}
              >
                {item.title}
              </button>
            ))}
          </nav>
        )}

        {showCart && <div className="header__actions">
          {gridColumns && onGridColumnsChange && (
            <button type="button" className="header-action swag-grid-switch" aria-label={gridColumns === 6 ? "Увеличить товары" : "Уменьшить товары"} onClick={() => onGridColumnsChange(gridColumns === 6 ? 3 : 6)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d={gridColumns === 6 ? "M5 12H19 M12 5V19" : "M5 12H19"} stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="header-action header-cart"
            onClick={onCartClick}
            aria-label="Открыть покупки"
          >
            <CartIcon count={count} />
          </button>
        </div>}
      </motion.div>
    </header>
  );
}
