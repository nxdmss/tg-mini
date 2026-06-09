import { useCart } from "../cart";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();

  return (
    <header className="header">
      <div className="container header__inner">
        <h1 className="logo">ZOV</h1>

        <button
          className="cart-btn"
          onClick={onCartClick}
          aria-label="Корзина"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 7h12l-1 13H7L6 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9 7a3 3 0 0 1 6 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {count > 0 && (
            <span className="cart-btn__badge">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}