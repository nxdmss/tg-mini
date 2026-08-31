import { useRef } from "react";

import { useNavigate } from "react-router-dom";

import { useCart } from "../cart";

import { tg } from "../telegram";

import { isTelegram } from "../platform";

import "./Header.css";

type HeaderProps = {
  onCartClick: () => void;
  homePath?: string;
  logoNegative?: boolean;
};

export function Header({
  onCartClick,
  homePath = "/",
  logoNegative = false,
}: HeaderProps) {
  const { count } = useCart();

  const navigate = useNavigate();

  const lastLogoTap = useRef(0);

  const telegramMode = isTelegram();

  function handleLogoClick() {
    if (!telegramMode) {
      navigate(homePath);

      return;
    }

    const now = Date.now();

    if (
      now - lastLogoTap.current <
      450
    ) {
      try {
        tg.HapticFeedback?.impactOccurred?.(
          "light",
        );
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
      <div className="container header__inner header__inner--store">
        <button
          className={`brand__logo ${
            logoNegative
              ? "brand__logo--negative"
              : ""
          }`}
          type="button"
          onClick={handleLogoClick}
          aria-label="SWA6Y5TAN"
        >
          <span className="brand__logo-mark">
            <img
              className="brand__logo-image brand__logo-image--base"
              src="/logo.png"
              alt="SWA6Y5TAN"
            />

            <img
              className="brand__logo-image brand__logo-image--negative"
              src="/logo.png"
              alt=""
              aria-hidden="true"
            />
          </span>
        </button>

        <span
          className="header__ghost-label"
          aria-hidden="true"
        >
          jopa
        </span>

        <div className="header__actions">
          <button
            type="button"
            className="header-action header-cart"
            onClick={onCartClick}
            aria-label="Корзина"
          >
            <span>
              Корзина
            </span>

            {count > 0 && (
              <span className="header-action__badge">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
