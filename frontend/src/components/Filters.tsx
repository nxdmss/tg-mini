import type { Category, ProductsQuery } from "../types";

type Props = {
  categories: Category[];
  query: ProductsQuery;
  count: number;
  onChange: (q: ProductsQuery) => void;
};

export function Filters({ categories, query, count, onChange }: Props) {
  return (
    <div className="toolbar">
      <div className="container">
        <div className="search-wrap">
          <svg className="search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="search"
            placeholder="Поиск брендов и вещей…"
            value={query.search ?? ""}
            onChange={(e) => onChange({ ...query, search: e.target.value })}
          />
        </div>
        <div className="chips">
          <button
            className={`chip ${!query.category ? "chip--active" : ""}`}
            onClick={() => onChange({ ...query, category: undefined })}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${query.category === c.name ? "chip--active" : ""}`}
              onClick={() => onChange({ ...query, category: c.name })}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="toolbar__row">
          <span className="count">
            <strong>{count}</strong> {count === 1 ? "товар" : count < 5 ? "товара" : "товаров"}
          </span>
          <select
            className="sort"
            value={query.sort ?? "newest"}
            onChange={(e) =>
              onChange({ ...query, sort: e.target.value as ProductsQuery["sort"] })
            }
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Сначала дешёвые</option>
            <option value="price_desc">Сначала дорогие</option>
          </select>
        </div>
      </div>
    </div>
  );
}
