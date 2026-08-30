
import { useEffect, useMemo, useState } from "react";

import { api } from "../api";

import type {
  AdminOrder,
  Brand,
  Category,
  Product,
} from "../types";

import "./Admin.css";

type TabKey =
  | "products"
  | "catalog"
  | "orders";

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

function parseMultilineValues(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatOrderDate(value?: string) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

export default function Admin() {
  const [activeTab, setActiveTab] =
    useState<TabKey>("products");

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState<string>("");

  const [products, setProducts] =
    useState<ProductWithShop[]>([]);
  const [brands, setBrands] =
    useState<Brand[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);
  const [orders, setOrders] =
    useState<AdminOrder[]>([]);
  const [shops, setShops] =
    useState<Shop[]>([]);

  const [productSearch, setProductSearch] =
    useState("");
  const [form, setForm] = useState<ProductFormState>(
    PRODUCT_FORM_INITIAL,
  );

  const [newBrandName, setNewBrandName] =
    useState("");
  const [newCategoryName, setNewCategoryName] =
    useState("");

  async function loadAdminData() {
    setLoading(true);
    setMessage("");

    try {
      const [
        productsRes,
        brandsRes,
        categoriesRes,
        ordersRes,
        shopsRes,
      ] = await Promise.all([
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
        brandId:
          current.brandId ||
          brandsRes.data[0]?.id ||
          "",
        categoryId:
          current.categoryId ||
          categoriesRes.data[0]?.id ||
          "",
      }));
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось загрузить админку. Обнови страницу.",
      );
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
      const values = [
        product.name,
        product.brand?.name,
        product.category?.name,
        product.shop?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(search);
    });
  }, [products, productSearch]);

  function updateForm(
    patch: Partial<ProductFormState>,
  ) {
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

  function startEditProduct(
    product: ProductWithShop,
  ) {
    setActiveTab("products");
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      description:
        product.description || "",
      inStock: product.inStock,
      brandId: product.brand?.id || "",
      categoryId:
        product.category?.id || "",
      sizesText: product.sizes
        .map((item) => item.size)
        .join("\n"),
      imagesText: product.images
        .map((item) => item.url)
        .join("\n"),
    });
    setMessage("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmitProduct(
    event: React.FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description:
          form.description.trim() || undefined,
        inStock: form.inStock,
        brandId: form.brandId,
        categoryId: form.categoryId,
        sizes: parseMultilineValues(
          form.sizesText,
        ),
        images: parseMultilineValues(
          form.imagesText,
        ),
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
        await api.patch(
          `/products/${form.id}`,
          payload,
        );
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

  async function handleDeleteProduct(
    productId: string,
  ) {
    const ok = window.confirm(
      "Удалить этот товар?",
    );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await api.delete(`/products/${productId}`);
      setMessage("Товар удалён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось удалить товар.",
      );
    }
  }

  async function handleCreateBrand() {
    const name = newBrandName.trim();

    if (!name) {
      return;
    }

    setMessage("");

    try {
      await api.post("/brands", { name });
      setNewBrandName("");
      setMessage("Бренд добавлен.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось добавить бренд.",
      );
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      return;
    }

    setMessage("");

    try {
      await api.post("/categories", {
        name,
      });
      setNewCategoryName("");
      setMessage("Категория добавлена.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось добавить категорию.",
      );
    }
  }

  async function handleDeleteBrand(
    brandId: string,
  ) {
    const ok = window.confirm(
      "Удалить бренд?",
    );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await api.delete(`/brands/${brandId}`);
      setMessage("Бренд удалён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось удалить бренд.",
      );
    }
  }

  async function handleDeleteCategory(
    categoryId: string,
  ) {
    const ok = window.confirm(
      "Удалить категорию?",
    );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await api.delete(
        `/categories/${categoryId}`,
      );
      setMessage("Категория удалена.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось удалить категорию.",
      );
    }
  }

  async function handleChangeOrderStatus(
    orderId: string,
    status: AdminOrder["status"],
  ) {
    setMessage("");

    try {
      await api.patch(
        `/orders/admin/${orderId}/status`,
        { status },
      );
      setMessage("Статус заказа обновлён.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Не удалось обновить статус заказа.",
      );
    }
  }

  const currentShopName =
    shops[0]?.name || "SWA6Y5TAN";

  return (
    <div className="admin-page">
      <div className="container admin-page__container">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <div className="admin-topbar__eyebrow">
              ADMIN
            </div>

            <h1 className="admin-topbar__title">
              SWA6Y5TAN PANEL
            </h1>
          </div>

          <div className="admin-topbar__right">
            <button
              type="button"
              className={`admin-tab ${
                activeTab === "products"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("products")
              }
            >
              Товары
            </button>

            <button
              type="button"
              className={`admin-tab ${
                activeTab === "catalog"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("catalog")
              }
            >
              Каталог
            </button>

            <button
              type="button"
              className={`admin-tab ${
                activeTab === "orders"
                  ? "is-active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("orders")
              }
            >
              Заказы
            </button>
          </div>
        </header>

        {message && (
          <div className="admin-toast">
            {message}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            ЗАГРУЗКА...
          </div>
        ) : (
          <>
            {activeTab === "products" && (
              <section className="admin-layout">
                <div className="admin-layout__main">
                  <form
                    className="admin-form"
                    onSubmit={
                      handleSubmitProduct
                    }
                  >
                    <div className="admin-card">
                      <div className="admin-card__number">
                        1
                      </div>

                      <div className="admin-card__content">
                        <div className="admin-card__header">
                          <h2>
                            ОСНОВА
                          </h2>

                          <div className="admin-badge">
                            магазин:{" "}
                            {currentShopName}
                          </div>
                        </div>

                        <div className="admin-grid admin-grid--2">
                          <label className="field">
                            <span className="field__label">
                              Название товара
                            </span>

                            <input
                              className="field__control"
                              value={form.name}
                              onChange={(event) =>
                                updateForm({
                                  name: event
                                    .target.value,
                                })
                              }
                              placeholder="Например: Oakley Zip Hoodie"
                            />
                          </label>

                          <label className="field">
                            <span className="field__label">
                              Цена
                            </span>

                            <input
                              className="field__control"
                              inputMode="numeric"
                              value={form.price}
                              onChange={(event) =>
                                updateForm({
                                  price: event
                                    .target.value,
                                })
                              }
                              placeholder="5900"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span className="field__label">
                            Описание
                          </span>

                          <textarea
                            className="field__control field__control--textarea"
                            value={form.description}
                            onChange={(event) =>
                              updateForm({
                                description:
                                  event.target
                                    .value,
                              })
                            }
                            placeholder="Коротко и по делу."
                          />
                        </label>

                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={form.inStock}
                            onChange={(event) =>
                              updateForm({
                                inStock:
                                  event.target
                                    .checked,
                              })
                            }
                          />

                          <span className="toggle__ui" />

                          <span className="toggle__text">
                            В наличии
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card__number">
                        2
                      </div>

                      <div className="admin-card__content">
                        <div className="admin-card__header">
                          <h2>
                            КАТАЛОГ
                          </h2>
                        </div>

                        <div className="admin-grid admin-grid--2">
                          <label className="field">
                            <span className="field__label">
                              Бренд
                            </span>

                            <select
                              className="field__control"
                              value={form.brandId}
                              onChange={(event) =>
                                updateForm({
                                  brandId:
                                    event.target
                                      .value,
                                })
                              }
                            >
                              <option value="">
                                Выбери бренд
                              </option>

                              {brands.map(
                                (brand) => (
                                  <option
                                    key={brand.id}
                                    value={
                                      brand.id
                                    }
                                  >
                                    {brand.name}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>

                          <label className="field">
                            <span className="field__label">
                              Категория
                            </span>

                            <select
                              className="field__control"
                              value={form.categoryId}
                              onChange={(event) =>
                                updateForm({
                                  categoryId:
                                    event.target
                                      .value,
                                })
                              }
                            >
                              <option value="">
                                Выбери категорию
                              </option>

                              {categories.map(
                                (
                                  category,
                                ) => (
                                  <option
                                    key={
                                      category.id
                                    }
                                    value={
                                      category.id
                                    }
                                  >
                                    {
                                      category.name
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card__number">
                        3
                      </div>

                      <div className="admin-card__content">
                        <div className="admin-card__header">
                          <h2>
                            РАЗМЕРЫ
                          </h2>

                          <div className="admin-card__hint">
                            один размер = одна строка
                          </div>
                        </div>

                        <label className="field">
                          <span className="field__label">
                            Размеры
                          </span>

                          <textarea
                            className="field__control field__control--textarea field__control--compact"
                            value={form.sizesText}
                            onChange={(event) =>
                              updateForm({
                                sizesText:
                                  event.target
                                    .value,
                              })
                            }
                            placeholder={"S\nM\nL\nXL"}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card__number">
                        4
                      </div>

                      <div className="admin-card__content">
                        <div className="admin-card__header">
                          <h2>
                            ФОТО
                          </h2>

                          <div className="admin-card__hint">
                            одна ссылка = одна строка
                          </div>
                        </div>

                        <label className="field">
                          <span className="field__label">
                            Ссылки на фото
                          </span>

                          <textarea
                            className="field__control field__control--textarea"
                            value={form.imagesText}
                            onChange={(event) =>
                              updateForm({
                                imagesText:
                                  event.target
                                    .value,
                              })
                            }
                            placeholder={"https://...\nhttps://..."}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="admin-actions">
                      <button
                        type="submit"
                        className="admin-button admin-button--primary"
                        disabled={saving}
                      >
                        {saving
                          ? "СОХРАНЯЮ..."
                          : form.id
                            ? "ОБНОВИТЬ ТОВАР"
                            : "СОЗДАТЬ ТОВАР"}
                      </button>

                      <button
                        type="button"
                        className="admin-button"
                        onClick={resetForm}
                      >
                        ОЧИСТИТЬ
                      </button>
                    </div>
                  </form>
                </div>

                <aside className="admin-layout__side">
                  <div className="admin-panel">
                    <div className="admin-panel__header">
                      <h3>
                        ТОВАРЫ
                      </h3>

                      <div className="admin-panel__meta">
                        {filteredProducts.length}
                      </div>
                    </div>

                    <input
                      className="field__control admin-search"
                      placeholder="Поиск по товарам"
                      value={productSearch}
                      onChange={(event) =>
                        setProductSearch(
                          event.target.value,
                        )
                      }
                    />

                    <div className="admin-products-list">
                      {filteredProducts.map(
                        (product) => (
                          <article
                            className="admin-product-card"
                            key={product.id}
                          >
                            <div className="admin-product-card__media">
                              {product.images[0] ? (
                                <img
                                  src={
                                    product
                                      .images[0]
                                      .url
                                  }
                                  alt={
                                    product.name
                                  }
                                />
                              ) : (
                                <div className="admin-product-card__placeholder">
                                  NO PHOTO
                                </div>
                              )}
                            </div>

                            <div className="admin-product-card__body">
                              <div className="admin-product-card__top">
                                <h4>
                                  {product.name}
                                </h4>

                                <div className="admin-badge">
                                  {formatPrice(
                                    product.price,
                                  )}
                                </div>
                              </div>

                              <div className="admin-product-card__meta">
                                <span>
                                  {
                                    product
                                      .brand
                                      ?.name
                                  }
                                </span>

                                <span>
                                  {
                                    product
                                      .category
                                      ?.name
                                  }
                                </span>

                                <span>
                                  {product.shop
                                    ?.name ||
                                    currentShopName}
                                </span>
                              </div>

                              <div className="admin-product-card__actions">
                                <button
                                  type="button"
                                  className="admin-mini-button"
                                  onClick={() =>
                                    startEditProduct(
                                      product,
                                    )
                                  }
                                >
                                  ИЗМЕНИТЬ
                                </button>

                                <button
                                  type="button"
                                  className="admin-mini-button admin-mini-button--danger"
                                  onClick={() =>
                                    handleDeleteProduct(
                                      product.id,
                                    )
                                  }
                                >
                                  УДАЛИТЬ
                                </button>
                              </div>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </div>
                </aside>
              </section>
            )}

            {activeTab === "catalog" && (
              <section className="admin-layout admin-layout--catalog">
                <div className="admin-panel">
                  <div className="admin-panel__header">
                    <h3>БРЕНДЫ</h3>
                    <div className="admin-panel__meta">
                      {brands.length}
                    </div>
                  </div>

                  <div className="admin-inline-form">
                    <input
                      className="field__control"
                      placeholder="Новый бренд"
                      value={newBrandName}
                      onChange={(event) =>
                        setNewBrandName(
                          event.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      className="admin-button admin-button--primary"
                      onClick={
                        handleCreateBrand
                      }
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-chip-list">
                    {brands.map((brand) => (
                      <div
                        className="admin-chip"
                        key={brand.id}
                      >
                        <span>
                          {brand.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteBrand(
                              brand.id,
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel__header">
                    <h3>КАТЕГОРИИ</h3>
                    <div className="admin-panel__meta">
                      {categories.length}
                    </div>
                  </div>

                  <div className="admin-inline-form">
                    <input
                      className="field__control"
                      placeholder="Новая категория"
                      value={newCategoryName}
                      onChange={(event) =>
                        setNewCategoryName(
                          event.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      className="admin-button admin-button--primary"
                      onClick={
                        handleCreateCategory
                      }
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-chip-list">
                    {categories.map(
                      (category) => (
                        <div
                          className="admin-chip"
                          key={category.id}
                        >
                          <span>
                            {category.name}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCategory(
                                category.id,
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "orders" && (
              <section className="admin-orders">
                {orders.map((order) => (
                  <article
                    className="admin-order-card"
                    key={order.id}
                  >
                    <div className="admin-order-card__top">
                      <div>
                        <div className="admin-order-card__title">
                          Заказ #{order.id.slice(0, 8)}
                        </div>

                        <div className="admin-order-card__meta">
                          {formatOrderDate(
                            order.createdAt,
                          )}
                        </div>
                      </div>

                      <select
                        className="field__control admin-status-select"
                        value={order.status}
                        onChange={(event) =>
                          void handleChangeOrderStatus(
                            order.id,
                            event.target
                              .value as AdminOrder["status"],
                          )
                        }
                      >
                        {ORDER_STATUSES.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="admin-order-card__columns">
                      <div className="admin-order-card__column">
                        <div className="admin-order-label">
                          Клиент
                        </div>
                        <div>
                          {order.customerName ||
                            order.user
                              ?.name ||
                            "—"}
                        </div>
                        <div>
                          {order.phone ||
                            order.user
                              ?.phone ||
                            "—"}
                        </div>
                      </div>

                      <div className="admin-order-card__column">
                        <div className="admin-order-label">
                          Доставка
                        </div>
                        <div>
                          {order.deliveryMethod ||
                            "—"}
                        </div>
                        <div>
                          {order.address ||
                            "—"}
                        </div>
                      </div>
                    </div>

                    <div className="admin-order-items">
                      {order.items.map((item) => (
                        <div
                          className="admin-order-item"
                          key={item.id}
                        >
                          <span>
                            {item.product.name}
                          </span>

                          <span>
                            {item.size}
                          </span>

                          <span>
                            ×{item.quantity}
                          </span>

                          <span>
                            {formatPrice(
                              item.price,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.comment && (
                      <div className="admin-order-comment">
                        {order.comment}
                      </div>
                    )}
                  </article>
                ))}

                {orders.length === 0 && (
                  <div className="admin-loading">
                    ЗАКАЗОВ ПОКА НЕТ
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
