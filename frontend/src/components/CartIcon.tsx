import "./CartIcon.css";

type CartIconProps = {
  count: number;
  className?: string;
  showCount?: boolean;
};

export function CartIcon({
  count,
  className = "",
  showCount = true,
}: CartIconProps) {
  const safeCount = Math.max(0, Math.floor(count));

  return (
    <span
      className={`sketch-cart sharp-bag ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        className="sharp-bag__mark"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <path
          d="M5.75 8.25H18.25L19.25 9.5V20L18.25 21H5.75L4.75 20V9.5L5.75 8.25Z M9 8.25V5.75L10.5 4.25H13.5L15 5.75V8.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
      </svg>
      {showCount && safeCount > 0 && (
        <span className="sharp-bag__count">{safeCount}</span>
      )}
    </span>
  );
}
