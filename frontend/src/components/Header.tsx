import { useCart } from "../cart";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();

  return (
    <header className="header">
      <div className="container header__inner">
        <div className="brand" aria-label="ZOV">
          <span className="brand__mark">Z</span>
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