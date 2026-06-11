import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createProduct,
  deleteProduct,
  getApiErrorMessage,
  getBrands,
  getCategories,
  getMe,
  getProducts,
  updateProduct,
  type ProductFormPayload,
} from "../api";
import type { AuthUser, Brand, Category, Product } from "../types";
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

export default function Admin() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
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
      const [me, brandsData, categoriesData, productsData] = await Promise.all([
        getMe(),
        getBrands(),
        getCategories(),
        getProducts(),
      ]);

      setUser(me);
      setBrands(brandsData);
      setCategories(categoriesData);
      setProducts(productsData);
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

  const selectedFiles = useMemo(
    () => form.files.map((file) => file.name).join(", "),
    [form.files],
  );
  const telegramInfo = getTelegramLaunchInfo();

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
          Доступ только для администраторов ZOV.
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page container">
      <div className="admin-hero">
        <div>
          <span className="eyebrow">ZOV admin</span>
          <h1>Управление каталогом</h1>
          <p>Создавайте карточки, обновляйте размеры, наличие и фото без доступа к базе.</p>
        </div>
        <Link className="admin-link" to="/">
          На витрину
        </Link>
      </div>

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
              onChange={(e) =>
                setForm({ ...form, files: Array.from(e.target.files ?? []) })
              }
            />
            <span>{selectedFiles || "Выбрать фото для Cloudinary"}</span>
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
                    <div className="media-fallback">ZOV</div>
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
    </main>
  );
}