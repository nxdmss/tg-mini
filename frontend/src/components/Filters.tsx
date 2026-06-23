import { useState } from "react";
import type { Category, ProductsQuery } from "../types";

type Props = {
  categories: Category[];
  query: ProductsQuery;
  onChange: (q: ProductsQuery) => void;
};

export function Filters({ categories, query, onChange }: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const sort = query.sort ?? "newest";
  const sortLabel =
    sort === "price_asc" ? "Дешевле" : sort === "price_desc" ? "Дороже" : "Новые";

  function setSort(nextSort: ProductsQuery["sort"]) {
    onChange({ ...query, sort: nextSort });
    setSortOpen(false);
  }

  return (
    <div className="toolbar">
      <div className="container toolbar__inner">
        <div className="search-strip">
          <input
            className="search-strip__input"
            placeholder=""
            aria-label="Поиск вещей и брендов"
            value={query.search ?? ""}
            onChange={(e) => onChange({ ...query, search: e.target.value })}
          />
        </div>

        <div className="toolbar__chips-row">
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
            <button
              className={`chip ${query.inStock ? "chip--active" : ""}`}
              onClick={() => onChange({ ...query, inStock: query.inStock ? undefined : true })}
            >
              В наличии
            </button>
          </div>

          <div className="sort-popover">
            <button
              type="button"
              className={`sort-btn ${sortOpen ? "sort-btn--active" : ""}`}
              onClick={() => setSortOpen((open) => !open)}
              aria-label={`Сортировка: ${sortLabel}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M8 9l4-4 4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 15l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {sortOpen && (
              <div className="sort-menu">
                <button
                  type="button"
                  className={sort === "newest" ? "sort-menu__item sort-menu__item--active" : "sort-menu__item"}
                  onClick={() => setSort("newest")}
                >
                  Сначала новые
                </button>
                <button
                  type="button"
                  className={sort === "price_asc" ? "sort-menu__item sort-menu__item--active" : "sort-menu__item"}
                  onClick={() => setSort("price_asc")}
                >
                  Сначала дешёвые
                </button>
                <button
                  type="button"
                  className={sort === "price_desc" ? "sort-menu__item sort-menu__item--active" : "sort-menu__item"}
                  onClick={() => setSort("price_desc")}
                >
                  Сначала дорогие
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
