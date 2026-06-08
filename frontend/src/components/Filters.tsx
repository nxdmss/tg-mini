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
        <input
          className="search"
          placeholder="Поиск по магазину"
          value={query.search ?? ""}
          onChange={(e) => onChange({ ...query, search: e.target.value })}
        />
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
          <span className="count">{count} товаров</span>
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
