type StoreTabsProps = {
  active: "for-you" | "stores";
  onForYou: () => void;
  onStores: () => void;
};

export function StoreTabs({ active, onForYou, onStores }: StoreTabsProps) {
  return (
    <nav className="store-tabs" aria-label="Навигация магазина">
      <button
        type="button"
        className={`store-tabs__item ${active === "for-you" ? "is-active" : ""}`}
        onClick={onForYou}
      >
        Для вас
      </button>
      <button
        type="button"
        className={`store-tabs__item ${active === "stores" ? "is-active" : ""}`}
        onClick={onStores}
      >
        Магазины
      </button>
    </nav>
  );
}
