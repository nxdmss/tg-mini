import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createBrand,
  createCategory,
  createProduct,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  getApiErrorMessage,
  getAdminOrders,
  getBrands,
  getCategories,
  getMe,
  getProducts,
  updateOrderStatus,
  updateProduct,
  type ProductFormPayload,
} from "../api";
import type { AdminOrder, AuthUser, Brand, Category, OrderStatus, Product } from "../types";
import { getTelegramLaunchInfo } from "../telegram";
import { formatPrice } from "../utils";

type FormState = {
  id?: string;
  name: string;
  price: string;
  description: string;
  brandId: string;
  categoryId: string;
  inStock: boolean;
  sizes: string;
  existingImages: string[];
  files: File[];
};

type AdminTab = "products" | "catalog" | "orders";
type OrderView = "active" | "archive";

const emptyForm: FormState = {
  name: "",
  price: "",
  description: "",
  brandId: "",
  categoryId: "",
  inStock: true,
  sizes: "XS, S, M, L, XL",
  existingImages: [],
  files: [],
};

function sizesFromInput(value: string) {
  return value
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
}

function hasLegacyUpload(product: Product) {
  return product.images.some((image) => image.url.includes("/uploads/"));
}

function shortOrderNumber(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }

  return String(hash).padStart(5, "0");
}

function orderTotal(order: AdminOrder) {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Новый",
  PAID: "В работе",
  SHIPPED: "Отправлен",
  DONE: "Готово",
  CANCELLED: "Отменен",
};

export default function Admin() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [orderView, setOrderView] = useState<OrderView>("active");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [brandName, setBrandName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(form.id);
  const canSubmit =
    form.name.trim().length > 1 &&
    Number(form.price) > 0 &&
    Boolean(form.brandId) &&
    Boolean(form.categoryId) &&
    sizesFromInput(form.sizes).length > 0;

  async function boot() {
    setBooting(true);
    setError(null);

    try {
      const [me, brandsData, categoriesData, productsData, ordersData] = await Promise.all([
        getMe(),
        getBrands(),
        getCategories(),
        getProducts(),
        getAdminOrders(),
      ]);

      setUser(me);
      setBrands(brandsData);
      setCategories(categoriesData);
      setProducts(productsData);
      setOrders(ordersData);
      setForm((current) => ({
        ...current,
        brandId: current.brandId || brandsData[0]?.id || "",
        categoryId: current.categoryId || categoriesData[0]?.id || "",
      }));
    } catch {
      setError("Не удалось загрузить админ-панель. Проверьте Telegram-доступ и API.");
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    // Data fetching on mount is intentional for this protected admin screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void boot();
  }, []);

  async function refreshProducts() {
    const data = await getProducts();
    setProducts(data);
  }

  async function refreshCatalog() {
    const [brandsData, categoriesData] = await Promise.all([getBrands(), getCategories()]);
    setBrands(brandsData);
    setCategories(categoriesData);
  }

  async function refreshOrders() {
    const data = await getAdminOrders();
    setOrders(data);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      brandId: brands[0]?.id || "",
      categoryId: categories[0]?.id || "",
    });
  }

  function editProduct(product: Product) {
    setMessage(null);
    setError(null);
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      description: product.description ?? "",
      brandId: product.brand.id,
      categoryId: product.category.id,
      inStock: product.inStock,
      sizes: product.sizes.map((size) => size.size).join(", "),
      existingImages: product.images.map((image) => image.url),
      files: [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toPayload(): ProductFormPayload {
    return {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim() || undefined,
      brandId: form.brandId,
      categoryId: form.categoryId,
      inStock: form.inStock,
      sizes: sizesFromInput(form.sizes),
      existingImages: form.existingImages,
      files: form.files,
    };
  }

  async function submit() {
    if (!canSubmit) {
      setError("Заполните название, цену, бренд, категорию и хотя бы один размер.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (form.id) {
        await updateProduct(form.id, toPayload());
        setMessage("Товар обновлен.");
      } else {
        await createProduct(toPayload());
        setMessage("Товар создан.");
      }

      await refreshProducts();
      resetForm();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Удалить "${product.name}"?`)) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteProduct(product.id);
      await refreshProducts();
      if (form.id === product.id) resetForm();
      setMessage("Товар удален.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function submitBrand() {
    const name = brandName.trim();
    if (!name) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await createBrand(name);
      setBrandName("");
      await refreshCatalog();
      setMessage("Бренд добавлен.");
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function submitCategory() {
    const name = categoryName.trim();
    if (!name) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await createCategory(name);
      setCategoryName("");
      await refreshCatalog();
      setMessage("Категория добавлена.");
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function removeBrand(brand: Brand) {
    if ((brand._count?.products ?? 0) > 0) {
      setError("Сначала перенесите или удалите товары этого бренда.");
      return;
    }

    if (!window.confirm(`Удалить бренд "${brand.name}"?`)) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteBrand(brand.id);
      await refreshCatalog();
      setMessage("Бренд удален.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category: Category) {
    if ((category._count?.products ?? 0) > 0) {
      setError("Сначала перенесите или удалите товары этой категории.");
      return;
    }

    if (!window.confirm(`Удалить категорию "${category.name}"?`)) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteCategory(category.id);
      await refreshCatalog();
      setMessage("Категория удалена.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function setOrderStatus(order: AdminOrder, status: OrderStatus) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedOrder = await updateOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)),
      );
      setMessage(`Заказ ${shortOrderNumber(order.id)} обновлен.`);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  const selectedFiles = useMemo(
    () => form.files.map((file) => file.name).join(", "),
    [form.files],
  );
  const telegramInfo = getTelegramLaunchInfo();
  const activeOrders = orders.filter(
    (order) => order.status !== "DONE" && order.status !== "CANCELLED",
  );
  const archivedOrders = orders.filter(
    (order) => order.status === "DONE" || order.status === "CANCELLED",
  );
  const visibleOrders = orderView === "active" ? activeOrders : archivedOrders;

  if (booting) {
    return (
      <main className="admin-page container">
        <div className="state">Загружаем админ-панель...</div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="admin-page container">
        <div className="state">
          <div className="state__icon">!</div>
          {error}
          <div className="debug-card">
            <span>Telegram object: {telegramInfo.hasTelegramObject ? "yes" : "no"}</span>
            <span>initData: {telegramInfo.hasInitData ? "yes" : "no"}</span>
            <span>initData length: {telegramInfo.initDataLength}</span>
            <span>User ID: {telegramInfo.userId ?? "none"}</span>
            <span>Platform: {telegramInfo.platform ?? "unknown"}</span>
            <span>Version: {telegramInfo.version ?? "unknown"}</span>
          </div>
        </div>
      </main>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <main className="admin-page container">
        <div className="state">
          <div className="state__icon">!</div>
          Доступ только для администраторов SWA6Y5TAN.
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page container">
      <div className="admin-hero">
        <div>
          <span className="eyebrow">SWA6Y5TAN admin</span>
          <h1>Управление каталогом</h1>
          <p>Создавайте карточки, обновляйте размеры, наличие и фото без доступа к базе.</p>
        </div>
        <Link className="admin-link" to="/">
          На витрину
        </Link>
      </div>

      <div className="admin-tabs">
        <button
          className={`chip ${activeTab === "products" ? "chip--active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Товары
        </button>
        <button
          className={`chip ${activeTab === "catalog" ? "chip--active" : ""}`}
          onClick={() => setActiveTab("catalog")}
        >
          Бренды и категории
        </button>
        <button
          className={`chip ${activeTab === "orders" ? "chip--active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Заказы
        </button>
      </div>

      {activeTab === "products" && (
      <section className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>{isEditing ? "Редактировать товар" : "Новый товар"}</h2>
            {isEditing && (
              <button className="link-remove" onClick={resetForm}>
                Сбросить
              </button>
            )}
          </div>

          <label className="admin-field">
            Название
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <div className="admin-two">
            <label className="admin-field">
              Цена
              <input
                className="field"
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="admin-field admin-check">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
              />
              В наличии
            </label>
          </div>

          <label className="admin-field">
            Описание
            <textarea
              className="field admin-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="admin-two">
            <label className="admin-field">
              Бренд
              <select
                className="field"
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              Категория
              <select
                className="field"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-field">
            Размеры через запятую
            <input
              className="field"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
          </label>

          {form.existingImages.length > 0 && (
            <div className="admin-images">
              {form.existingImages.map((url) => (
                <button
                  key={url}
                  className="admin-image"
                  onClick={() =>
                    setForm({
                      ...form,
                      existingImages: form.existingImages.filter((image) => image !== url),
                    })
                  }
                  title="Убрать изображение"
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}

          <label className="admin-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length === 0) return;
                setForm({ ...form, files: [...form.files, ...picked] });
                e.target.value = "";
              }}
            />
            <span>
              {selectedFiles || "Добавить фото (можно несколько)"}
              {form.existingImages.length > 0 &&
                ` · сохранено: ${form.existingImages.length}`}
            </span>
          </label>

          {message && <div className="notice notice--ok">{message}</div>}
          {error && <div className="notice notice--error">{error}</div>}

          <button className="btn" onClick={submit} disabled={saving || !canSubmit}>
            {saving ? "Сохраняем..." : isEditing ? "Сохранить изменения" : "Создать товар"}
          </button>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>Товары</h2>
            <span className="count">
              <strong>{products.length}</strong> всего
            </span>
          </div>

          <div className="admin-list">
            {products.map((product) => (
              <article className="admin-product" key={product.id}>
                <div className="admin-product__media">
                  {product.images[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} />
                  ) : (
                    <div className="media-fallback">SWA6Y5TAN</div>
                  )}
                </div>
                <div className="admin-product__body">
                  <span className="admin-product__name">{product.name}</span>
                  <span className="admin-product__meta">
                    {product.category.name} · {formatPrice(product.price)}
                  </span>
                  <span className="admin-product__meta">
                    {product.inStock ? "В наличии" : "Скрыт из наличия"} ·{" "}
                    {product.sizes.map((size) => size.size).join(", ") || "без размеров"}
                  </span>
                  {(product.sizes.length === 0 || hasLegacyUpload(product)) && (
                    <div className="admin-badges">
                      {product.sizes.length === 0 && (
                        <span className="admin-badge admin-badge--warn">Добавьте размеры</span>
                      )}
                      {hasLegacyUpload(product) && (
                        <span className="admin-badge admin-badge--warn">
                          Замените фото на Cloudinary
                        </span>
                      )}
                    </div>
                  )}
                  <div className="admin-product__actions">
                    <button className="chip" onClick={() => editProduct(product)}>
                      Изменить
                    </button>
                    <button className="chip" onClick={() => void removeProduct(product)}>
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {activeTab === "catalog" && (
        <section className="admin-grid">
          <div className="admin-panel">
            <div className="admin-panel__head">
              <h2>Новый бренд</h2>
            </div>
            <label className="admin-field">
              Название бренда
              <input
                className="field"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </label>
            <button className="btn" onClick={submitBrand} disabled={saving || !brandName.trim()}>
              Добавить бренд
            </button>

            <div className="admin-list admin-list--compact">
              {brands.map((brand) => (
                <div className="admin-row" key={brand.id}>
                  <span>{brand.name}</span>
                  <div className="admin-row__actions">
                    <span className="count">{brand._count?.products ?? 0} товаров</span>
                    <button
                      className="link-remove"
                      onClick={() => void removeBrand(brand)}
                      disabled={saving || (brand._count?.products ?? 0) > 0}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__head">
              <h2>Новая категория</h2>
            </div>
            <label className="admin-field">
              Название категории
              <input
                className="field"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </label>
            <button
              className="btn"
              onClick={submitCategory}
              disabled={saving || !categoryName.trim()}
            >
              Добавить категорию
            </button>

            <div className="admin-list admin-list--compact">
              {categories.map((category) => (
                <div className="admin-row" key={category.id}>
                  <span>{category.name}</span>
                  <div className="admin-row__actions">
                    <span className="count">{category._count?.products ?? 0} товаров</span>
                    <button
                      className="link-remove"
                      onClick={() => void removeCategory(category)}
                      disabled={saving || (category._count?.products ?? 0) > 0}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(message || error) && (
            <div className="admin-panel">
              {message && <div className="notice notice--ok">{message}</div>}
              {error && <div className="notice notice--error">{error}</div>}
            </div>
          )}
        </section>
      )}

      {activeTab === "orders" && (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Заказы</h2>
            <div className="admin-panel__actions">
              <span className="count">
                <strong>{visibleOrders.length}</strong> в списке
              </span>
              <button className="chip" onClick={() => void refreshOrders()}>
                Обновить
              </button>
            </div>
          </div>

          <div className="admin-tabs admin-tabs--inner">
            <button
              className={`chip ${orderView === "active" ? "chip--active" : ""}`}
              onClick={() => setOrderView("active")}
            >
              Активные {activeOrders.length}
            </button>
            <button
              className={`chip ${orderView === "archive" ? "chip--active" : ""}`}
              onClick={() => setOrderView("archive")}
            >
              Архив {archivedOrders.length}
            </button>
          </div>

          {message && <div className="notice notice--ok">{message}</div>}
          {error && <div className="notice notice--error">{error}</div>}

          <div className="admin-orders">
            {visibleOrders.length === 0 ? (
              <div className="state">
                {orderView === "active" ? "Активных заказов нет" : "Архив заказов пуст"}
              </div>
            ) : (
              visibleOrders.map((order) => (
                <article className="admin-order" key={order.id}>
                  <div className="admin-order__head">
                    <div>
                      <span className="admin-product__name">
                        Заказ {shortOrderNumber(order.id)}
                      </span>
                      <span className="admin-product__meta">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("ru-RU")
                          : "без даты"}
                      </span>
                    </div>
                    <span className="admin-badge">{orderStatusLabel[order.status]}</span>
                  </div>

                  <div className="admin-order__details">
                    <span>Имя: {order.customerName || order.user.name || "не указано"}</span>
                    <span>Телефон: {order.phone || order.user.phone || "не указан"}</span>
                    <span>
                      Telegram:{" "}
                      <a href={`tg://user?id=${order.user.telegramId}`}>
                        {order.user.telegramId}
                      </a>
                    </span>
                    <span>Получение: {order.deliveryMethod || "не указано"}</span>
                    <span>Адрес: {order.address || "не указан"}</span>
                    <span>Комментарий: {order.comment || "нет"}</span>
                  </div>

                  <div className="admin-order__items">
                    {order.items.map((item) => (
                      <span key={item.id}>
                        {item.product.name} · размер {item.size} · {item.quantity} шт. ·{" "}
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    ))}
                  </div>

                  <div className="summary-row">
                    <span>Итого</span>
                    <span>{formatPrice(orderTotal(order))}</span>
                  </div>

                  <div className="admin-product__actions">
                    <button
                      className="chip"
                      onClick={() => void setOrderStatus(order, "PAID")}
                      disabled={saving}
                    >
                      В работе
                    </button>
                    <button
                      className="chip"
                      onClick={() => void setOrderStatus(order, "DONE")}
                      disabled={saving}
                    >
                      Готово
                    </button>
                    <button
                      className="chip"
                      onClick={() => void setOrderStatus(order, "CANCELLED")}
                      disabled={saving}
                    >
                      Отменить
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}