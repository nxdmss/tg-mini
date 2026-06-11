import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../cart";
import { tg } from "../telegram";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();
  const navigate = useNavigate();
  const lastLogoTap = useRef(0);

  function openHiddenAdmin() {
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
      <div className="container header__inner">
        <div className="brand" aria-label="ZOV">
          <button
            className="brand__mark"
            type="button"
            onClick={openHiddenAdmin}
            aria-label="ZOV"
          >
            Z
          </button>
          <span className="brand__name">ZOV</span>
        </div>

        <button
          className="header-cart"
          onClick={onCartClick}
          aria-label="Корзина"
        >
          Корзина

          {count > 0 && (
            <span className="header-cart__badge">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}