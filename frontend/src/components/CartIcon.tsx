import "./CartIcon.css";

type CartIconProps = {
  count: number;
  className?: string;
};

export function CartIcon({
  count,
  className = "",
}: CartIconProps) {
  const safeCount = Math.max(
    0,
    Math.floor(count),
  );

  const digits =
    String(safeCount).split("");

  const countClass =
    digits.length >= 3
      ? "sketch-cart__count sketch-cart__count--long"
      : "sketch-cart__count";

  return (
    <span
      className={`sketch-cart ${className}`.trim()}
      aria-hidden="true"
    >
      <img
        className="sketch-cart__body"
        src="/cart/cart.png"
        alt=""
        draggable={false}
      />

      <span className={countClass}>
        {digits.map(
          (digit, index) => (
            <img
              key={`${digit}-${index}`}
              className="sketch-cart__digit"
              src={`/cart/${digit}.png`}
              alt=""
              draggable={false}
            />
          ),
        )}
      </span>
    </span>
  );
}
