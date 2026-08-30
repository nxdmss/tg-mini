import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api";
import type { AdminOrder, Brand, Category, Product } from "../types";
import "./Admin.css";

type TabKey = "products" | "catalog" | "orders";

type Shop = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

type ProductWithShop = Product & {
  shop?: Shop | null;
};

type ProductFormState = {
  id?: string;
  name: string;
  price: string;
  description: string;
  inStock: boolean;
  brandId: string;
  categoryId: string;
  sizesText: string;
  imagesText: string;
};

const PRODUCT_FORM_INITIAL: ProductFormState = {
  name: "",
  price: "",
  description: "",
  inStock: true,
  brandId: "",
  categoryId: "",
  sizesText: "",
  imagesText: "",
};

const ORDER_STATUSES: AdminOrder["status"][] = [
  "PENDING",
  "PAID",
  "CANCELLED",
  "SHIPPED",
  "DONE",
];

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatDate(value?: string) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabKey>("products");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [products, setProducts] = useState<ProductWithShop[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  const [productSearch, setProductSearch] = useState("");

  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [form, setForm] = useState<ProductFormState>(PRODUCT_FORM_INITIAL);

  async function loadAdminData() {
    setLoading(true);
    setMessage("");

    try {
      const [productsRes, brandsRes, categoriesRes, ordersRes, shopsRes] =
        await Promise.all([
          api.get<ProductWithShop[]>("/products"),
          api.get<Brand[]>("/brands"),
          api.get<Category[]>("/categories"),
          api.get<AdminOrder[]>("/orders/admin"),
          api.get<Shop[]>("/shops"),
        ]);

      setProducts(productsRes.data);
      setBrands(brandsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setShops(shopsRes.data);

      setForm((current) => ({
        ...current,
        brandId: current.brandId || brandsRes.data[0]?.id || "",
        categoryId: current.categoryId || categoriesRes.data[0]?.id || "",
      }));
    } catch (error) {
      console.error(error);
      setMessage("Не удалось загрузить админку.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      const text = [
        product.name,
        product.brand?.name,
        product.category?.name,
        product.shop?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }, [products, productSearch]);

  function updateForm(patch: Partial<ProductFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function resetForm() {
    setForm({
      ...PRODUCT_FORM_INITIAL,
      brandId: brands[0]?.id || "",
      categoryId: categories[0]?.id || "",
    });
    setMessage("");
  }

  function startEditProduct(product: ProductWithShop) {
    setActiveTab("products");
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      description: product.description || "",
      inStock: product.inStock,
      brandId: product.brand?.id || "",
      categoryId: product.category?.id || "",
      sizesText: product.sizes.map((item) => item.size).join("\n"),
      imagesText: product.images.map((item) => item.url).join("\n"),
    });
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmitProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || undefined,
        inStock: form.inStock,
        brandId: form.brandId,
        categoryId: form.categoryId,
        sizes: parseLines(form.sizesText),
        images: parseLines(form.imagesText),
      };

      if (!payload.name) {
        throw new Error("Укажи название товара.");
      }

      if (!payload.price || Number.isNaN(payload.price)) {
        throw new Error("Укажи корректную цену.");
      }

      if (!payload.brandId) {
        throw new Error("Выбери бренд.");
      }

      if (!payload.categoryId) {
        throw new Error("Выбери категорию.");
      }

      if (form.id) {
        await api.patch(`/products/${form.id}`, payload);
        setMessage("Товар обновлён.");
      } else {
        await api.post("/products", payload);
        setMessage("Товар создан.");
      }

      resetForm();
      await loadAdminData();
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.message ||
          error?.response?.data?.message ||
          "Не удалось сохранить товар.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    const ok = window.confirm("Удалить товар?");

    if (!ok) return;

    setMessage("");

    try {
      await api.delete(`/products/${productId}`);
      setMessage("Товар удалён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось удалить товар.");
    }
  }

  async function handleCreateBrand() {
    const name = newBrandName.trim();
    if (!name) return;

    setMessage("");

    try {
      await api.post("/brands", { name });
      setNewBrandName("");
      setMessage("Бренд добавлен.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось добавить бренд.");
    }
  }

  async function handleDeleteBrand(brandId: string) {
    const ok = window.confirm("Удалить бренд?");
    if (!ok) return;

    setMessage("");

    try {
      await api.delete(`/brands/${brandId}`);
      setMessage("Бренд удалён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось удалить бренд.");
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    setMessage("");

    try {
      await api.post("/categories", { name });
      setNewCategoryName("");
      setMessage("Категория добавлена.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось добавить категорию.");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    const ok = window.confirm("Удалить категорию?");
    if (!ok) return;

    setMessage("");

    try {
      await api.delete(`/categories/${categoryId}`);
      setMessage("Категория удалена.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось удалить категорию.");
    }
  }

  async function handleChangeOrderStatus(
    orderId: string,
    status: AdminOrder["status"],
  ) {
    setMessage("");

    try {
      await api.patch(`/orders/admin/${orderId}/status`, { status });
      setMessage("Статус заказа обновлён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось обновить статус заказа.");
    }
  }

  const currentShopName = shops[0]?.name || "SWA6Y5TAN";

  return (
    <div className="admin-page">
      <div className="container admin">
        <header className="admin-header">
          <div className="admin-header__eyebrow">ADMIN</div>
          <h1 className="admin-header__title">SWA6Y5TAN</h1>
        </header>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tabs__button ${activeTab === "products" ? "is-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Товары
          </button>

          <button
            type="button"
            className={`admin-tabs__button ${activeTab === "catalog" ? "is-active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            Каталог
          </button>

          <button
            type="button"
            className={`admin-tabs__button ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Заказы
          </button>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {loading ? (
          <div className="admin-box">ЗАГРУЗКА...</div>
        ) : (
          <>
            {activeTab === "products" && (
              <div className="admin-stack">
                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>{form.id ? "Изменить товар" : "Новый товар"}</h2>
                    <span className="admin-pill">{currentShopName}</span>
                  </div>

                  <form className="admin-form" onSubmit={handleSubmitProduct}>
                    <label className="admin-field">
                      <span>Название</span>
                      <input
                        value={form.name}
                        onChange={(event) =>
                          updateForm({ name: event.target.value })
                        }
                        placeholder="Например: Zip Hoodie"
                      />
                    </label>

                    <label className="admin-field">
                      <span>Цена</span>
                      <input
                        inputMode="numeric"
                        value={form.price}
                        onChange={(event) =>
                          updateForm({ price: event.target.value })
                        }
                        placeholder="5900"
                      />
                    </label>

                    <label className="admin-field">
                      <span>Описание</span>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm({ description: event.target.value })
                        }
                        placeholder="Короткое описание"
                      />
                    </label>

                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={form.inStock}
                        onChange={(event) =>
                          updateForm({ inStock: event.target.checked })
                        }
                      />
                      <span>В наличии</span>
                    </label>

                    <label className="admin-field">
                      <span>Бренд</span>
                      <select
                        value={form.brandId}
                        onChange={(event) =>
                          updateForm({ brandId: event.target.value })
                        }
                      >
                        <option value="">Выбери бренд</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-field">
                      <span>Категория</span>
                      <select
                        value={form.categoryId}
                        onChange={(event) =>
                          updateForm({ categoryId: event.target.value })
                        }
                      >
                        <option value="">Выбери категорию</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-field">
                      <span>Размеры</span>
                      <textarea
                        value={form.sizesText}
                        onChange={(event) =>
                          updateForm({ sizesText: event.target.value })
                        }
                        placeholder={"S\nM\nL\nXL"}
                      />
                    </label>

                    <label className="admin-field">
                      <span>Фото (1 ссылка = 1 строка)</span>
                      <textarea
                        value={form.imagesText}
                        onChange={(event) =>
                          updateForm({ imagesText: event.target.value })
                        }
                        placeholder={"https://...\nhttps://..."}
                      />
                    </label>

                    <div className="admin-actions">
                      <button
                        type="submit"
                        className="admin-btn admin-btn--primary"
                        disabled={saving}
                      >
                        {saving
                          ? "СОХРАНЯЮ..."
                          : form.id
                            ? "ОБНОВИТЬ"
                            : "СОЗДАТЬ"}
                      </button>

                      <button
                        type="button"
                        className="admin-btn"
                        onClick={resetForm}
                      >
                        ОЧИСТИТЬ
                      </button>
                    </div>
                  </form>
                </section>

                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>Товары</h2>
                    <span className="admin-pill">{filteredProducts.length}</span>
                  </div>

                  <input
                    className="admin-search"
                    placeholder="Поиск товара"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                  />

                  <div className="admin-list">
                    {filteredProducts.map((product) => (
                      <article className="admin-item" key={product.id}>
                        <div className="admin-item__media">
                          {product.images[0] ? (
                            <img src={product.images[0].url} alt={product.name} />
                          ) : (
                            <div className="admin-item__placeholder">NO PHOTO</div>
                          )}
                        </div>

                        <div className="admin-item__body">
                          <h3>{product.name}</h3>

                          <div className="admin-item__meta">
                            <span>{formatPrice(product.price)}</span>
                            <span>{product.brand?.name || "—"}</span>
                            <span>{product.category?.name || "—"}</span>
                          </div>

                          <div className="admin-item__buttons">
                            <button
                              type="button"
                              className="admin-btn"
                              onClick={() => startEditProduct(product)}
                            >
                              ИЗМЕНИТЬ
                            </button>

                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              УДАЛИТЬ
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="admin-empty">Товаров не найдено</div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "catalog" && (
              <div className="admin-stack">
                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>Бренды</h2>
                    <span className="admin-pill">{brands.length}</span>
                  </div>

                  <div className="admin-inline">
                    <input
                      value={newBrandName}
                      onChange={(event) => setNewBrandName(event.target.value)}
                      placeholder="Новый бренд"
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleCreateBrand}
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-tags">
                    {brands.map((brand) => (
                      <div className="admin-tag" key={brand.id}>
                        <span>{brand.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(brand.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>Категории</h2>
                    <span className="admin-pill">{categories.length}</span>
                  </div>

                  <div className="admin-inline">
                    <input
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      placeholder="Новая категория"
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleCreateCategory}
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-tags">
                    {categories.map((category) => (
                      <div className="admin-tag" key={category.id}>
                        <span>{category.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="admin-stack">
                {orders.map((order) => (
                  <section className="admin-box" key={order.id}>
                    <div className="admin-box__head admin-box__head--order">
                      <div>
                        <h2>Заказ #{order.id.slice(0, 8)}</h2>
                        <div className="admin-order-date">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <select
                        className="admin-order-select"
                        value={order.status}
                        onChange={(event) =>
                          void handleChangeOrderStatus(
                            order.id,
                            event.target.value as AdminOrder["status"],
                          )
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-order-grid">
                      <div className="admin-order-block">
                        <div className="admin-order-label">Клиент</div>
                        <div>{order.customerName || order.user?.name || "—"}</div>
                        <div>{order.phone || order.user?.phone || "—"}</div>
                      </div>

                      <div className="admin-order-block">
                        <div className="admin-order-label">Доставка</div>
                        <div>{order.deliveryMethod || "—"}</div>
                        <div>{order.address || "—"}</div>
                      </div>
                    </div>

                    <div className="admin-order-items">
                      {order.items.map((item) => (
                        <div className="admin-order-item" key={item.id}>
                          <span>{item.product.name}</span>
                          <span>{item.size}</span>
                          <span>×{item.quantity}</span>
                          <span>{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {order.comment && (
                      <div className="admin-order-comment">{order.comment}</div>
                    )}
                  </section>
                ))}

                {orders.length === 0 && (
                  <div className="admin-box">ЗАКАЗОВ ПОКА НЕТ</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}