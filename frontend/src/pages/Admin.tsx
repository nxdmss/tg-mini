import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import {
  createBrand,
  createCategory,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  getAdminOrders,
  getBrands,
  getCategories,
  getProducts,
  updateOrderStatus,
} from "../api";

import {
  createAdminProduct,
  moveAdminProductToShop,
  updateAdminProduct,
} from "../productAdminApi";

import {
  createShop,
  deleteShop,
  getAdminShops,
  updateShop,
  type AdminShop,
} from "../shopAdminApi";

import type {
  AdminOrder,
  Brand,
  Category,
  Product,
} from "../types";

import "./Admin.css";

type TabKey =
  | "products"
  | "shops"
  | "catalog"
  | "orders";

type ProductWithShop = Product & {
  shop?: AdminShop | null;
};

type ShopFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
};

const SHOP_FORM_INITIAL: ShopFormState = {
  name: "",
  slug: "",
  description: "",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  accentColor: "#000000",
  isActive: true,
};

type ProductImageDraft =
  | {
      key: string;
      type: "url";
      url: string;
    }
  | {
      key: string;
      type: "file";
      file: File;
      previewUrl: string;
    };

type ProductFormState = {
  id?: string;
  shopId: string;
  name: string;
  price: string;
  description: string;
  inStock: boolean;
  brandId: string;
  categoryId: string;
  sizesText: string;
};

const PRODUCT_FORM_INITIAL: ProductFormState = {
  shopId: "",
  name: "",
  price: "",
  description: "",
  inStock: true,
  brandId: "",
  categoryId: "",
  sizesText: "",
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
  return (
    new Intl.NumberFormat("ru-RU").format(
      value,
    ) + " ₽"
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString(
      "ru-RU",
    );
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
    useState("");

  const [products, setProducts] =
    useState<ProductWithShop[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [shops, setShops] =
    useState<AdminShop[]>([]);

  const [shopForm, setShopForm] =
    useState<ShopFormState>(
      SHOP_FORM_INITIAL,
    );

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    newBrandName,
    setNewBrandName,
  ] = useState("");

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState("");

  const [form, setForm] =
    useState<ProductFormState>(
      PRODUCT_FORM_INITIAL,
    );

  const [productImages, setProductImages] =
    useState<ProductImageDraft[]>([]);

  const [draggingProductId, setDraggingProductId] =
    useState<string | null>(null);

  const [dragOverShopId, setDragOverShopId] =
    useState<string | null>(null);

  async function loadAdminData() {
    setLoading(true);
    setMessage("");

    const [
      productsResult,
      brandsResult,
      categoriesResult,
      shopsResult,
      ordersResult,
    ] = await Promise.allSettled([
      getProducts(),
      getBrands(),
      getCategories(),
      getAdminShops(),
      getAdminOrders(),
    ]);

    if (
      productsResult.status ===
      "fulfilled"
    ) {
      setProducts(
        productsResult.value as ProductWithShop[],
      );
    } else {
      console.error(
        productsResult.reason,
      );
      setProducts([]);
    }

    if (
      brandsResult.status ===
      "fulfilled"
    ) {
      setBrands(brandsResult.value);
    } else {
      console.error(
        brandsResult.reason,
      );
      setBrands([]);
    }

    if (
      categoriesResult.status ===
      "fulfilled"
    ) {
      setCategories(
        categoriesResult.value,
      );
    } else {
      console.error(
        categoriesResult.reason,
      );
      setCategories([]);
    }

    if (
      shopsResult.status ===
      "fulfilled"
    ) {
      setShops(shopsResult.value);
    } else {
      console.error(
        shopsResult.reason,
      );
      setShops([]);
    }

    if (
      ordersResult.status ===
      "fulfilled"
    ) {
      setOrders(ordersResult.value);
    } else {
      console.error(
        ordersResult.reason,
      );
      setOrders([]);
    }

    const nextBrands =
      brandsResult.status ===
      "fulfilled"
        ? brandsResult.value
        : [];

    const nextCategories =
      categoriesResult.status ===
      "fulfilled"
        ? categoriesResult.value
        : [];

    const nextShops =
      shopsResult.status ===
      "fulfilled"
        ? shopsResult.value
        : [];

    const defaultShopId =
      nextShops.find(
        (shop) =>
          shop.slug ===
            "swagystan" &&
          shop.isActive,
      )?.id ||
      nextShops.find(
        (shop) => shop.isActive,
      )?.id ||
      "";

    setForm((current) => ({
      ...current,

      shopId:
        nextShops.some(
          (shop) =>
            shop.id ===
              current.shopId &&
            shop.isActive,
        )
          ? current.shopId
          : defaultShopId,

      brandId:
        current.brandId ||
        nextBrands[0]?.id ||
        "",

      categoryId:
        current.categoryId ||
        nextCategories[0]?.id ||
        "",
    }));

    const publicDataFailed =
      productsResult.status ===
        "rejected" ||
      brandsResult.status ===
        "rejected" ||
      categoriesResult.status ===
        "rejected";

    if (publicDataFailed) {
      setMessage(
        "Часть данных не загрузилась. Обнови страницу.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const search =
        productSearch
          .trim()
          .toLowerCase();

      const shopProducts =
        form.shopId
          ? products.filter(
              (product) =>
                product.shop?.id ===
                form.shopId,
            )
          : [];

      if (!search) {
        return shopProducts;
      }

      return shopProducts.filter(
        (product) => {
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
        },
      );
    }, [
      products,
      productSearch,
      form.shopId,
    ]);

  function updateForm(
    patch: Partial<ProductFormState>,
  ) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function revokeDraftPreviews(
    drafts: ProductImageDraft[],
  ) {
    drafts.forEach((item) => {
      if (item.type === "file") {
        URL.revokeObjectURL(
          item.previewUrl,
        );
      }
    });
  }

  function clearProductImages() {
    setProductImages((current) => {
      revokeDraftPreviews(current);
      return [];
    });
  }

  function handleProductFiles(
    files: FileList | null,
  ) {
    if (!files) {
      return;
    }

    const selected =
      Array.from(files).filter(
        (file) =>
          file.type.startsWith(
            "image/",
          ),
      );

    setProductImages((current) => {
      const available =
        Math.max(
          0,
          10 - current.length,
        );

      const accepted =
        selected.slice(
          0,
          available,
        );

      const next =
        accepted.map(
          (file, index) => ({
            key: `file-${Date.now()}-${index}-${file.name}`,
            type: "file" as const,
            file,
            previewUrl:
              URL.createObjectURL(
                file,
              ),
          }),
        );

      return [
        ...current,
        ...next,
      ];
    });
  }

  function removeProductImage(
    key: string,
  ) {
    setProductImages((current) =>
      current.filter((item) => {
        if (item.key !== key) {
          return true;
        }

        if (item.type === "file") {
          URL.revokeObjectURL(
            item.previewUrl,
          );
        }

        return false;
      }),
    );
  }

  function resetForm() {
    clearProductImages();

    const fallbackShopId =
      shops.find(
        (shop) =>
          shop.slug ===
            "swagystan" &&
          shop.isActive,
      )?.id ||
      shops.find(
        (shop) => shop.isActive,
      )?.id ||
      "";

    setForm({
      ...PRODUCT_FORM_INITIAL,

      shopId:
        form.shopId ||
        fallbackShopId,

      brandId:
        brands[0]?.id || "",

      categoryId:
        categories[0]?.id || "",
    });

    setMessage("");
  }

  function startEditProduct(
    product: ProductWithShop,
  ) {
    setActiveTab("products");

    setForm({
      id: product.id,
      shopId:
        product.shop?.id ||
        form.shopId,
      name: product.name,
      price: String(
        product.price,
      ),
      description:
        product.description || "",
      inStock: product.inStock,
      brandId:
        product.brand?.id || "",
      categoryId:
        product.category?.id || "",
      sizesText:
        product.sizes
          .map(
            (item) => item.size,
          )
          .join("\n"),
    });

    setProductImages((current) => {
      revokeDraftPreviews(current);

      return product.images.map(
        (item, index) => ({
          key: `url-${index}-${item.url}`,
          type: "url" as const,
          url: item.url,
        }),
      );
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmitProduct(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const name =
        form.name.trim();

      const price =
        Number(form.price);

      if (!name) {
        throw new Error(
          "Укажи название товара.",
        );
      }

      if (
        !price ||
        Number.isNaN(price)
      ) {
        throw new Error(
          "Укажи корректную цену.",
        );
      }

      if (!form.shopId) {
        throw new Error(
          "Выбери магазин.",
        );
      }

      if (!form.brandId) {
        throw new Error(
          "Выбери бренд.",
        );
      }

      if (!form.categoryId) {
        throw new Error(
          "Выбери категорию.",
        );
      }

      const payload = {
        shopId:
          form.shopId,

        name,
        price,

        description:
          form.description
            .trim() ||
          undefined,

        inStock:
          form.inStock,

        brandId:
          form.brandId,

        categoryId:
          form.categoryId,

        sizes:
          parseLines(
            form.sizesText,
          ),

        imageItems:
          productImages.map(
            (item) =>
              item.type === "url"
                ? {
                    key: item.key,
                    type: "url" as const,
                    url: item.url,
                  }
                : {
                    key: item.key,
                    type: "file" as const,
                    file: item.file,
                  },
          ),
      };

      if (form.id) {
        await updateAdminProduct(
          form.id,
          payload,
        );

        setMessage(
          "Товар обновлён.",
        );
      } else {
        await createAdminProduct(
          payload,
        );

        setMessage(
          "Товар создан.",
        );
      }

      resetForm();

      await loadAdminData();
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          error?.response
            ?.data?.message ||
          "Не удалось сохранить товар.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveProduct(
    productId: string,
    shopId: string,
  ) {
    if (!shopId) {
      return;
    }

    const product =
      products.find(
        (item) =>
          item.id === productId,
      );

    if (
      product?.shop?.id ===
      shopId
    ) {
      return;
    }

    setMessage("");

    try {
      await moveAdminProductToShop(
        productId,
        shopId,
      );

      setMessage(
        "Товар перенесён.",
      );

      if (
        form.id === productId
      ) {
        updateForm({
          shopId,
        });
      }

      await loadAdminData();
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.response?.data
          ?.message ||
          "Не удалось перенести товар.",
      );
    } finally {
      setDraggingProductId(
        null,
      );
      setDragOverShopId(
        null,
      );
    }
  }

  async function handleDropProduct(
    shopId: string,
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    const productId =
      event.dataTransfer.getData(
        "text/product-id",
      ) || draggingProductId;

    if (!productId) {
      return;
    }

    await handleMoveProduct(
      productId,
      shopId,
    );
  }

  async function handleDeleteProduct(
    productId: string,
  ) {
    const ok =
      window.confirm(
        "Удалить товар?",
      );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await deleteProduct(
        productId,
      );

      setMessage(
        "Товар удалён.",
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Не удалось удалить товар.",
      );
    }
  }

  async function handleCreateBrand() {
    const name =
      newBrandName.trim();

    if (!name) {
      return;
    }

    setMessage("");

    try {
      await createBrand(name);

      setNewBrandName("");

      setMessage(
        "Бренд добавлен.",
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Не удалось добавить бренд.",
      );
    }
  }

  async function handleDeleteBrand(
    brandId: string,
  ) {
    const ok =
      window.confirm(
        "Удалить бренд?",
      );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await deleteBrand(
        brandId,
      );

      setMessage(
        "Бренд удалён.",
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Не удалось удалить бренд.",
      );
    }
  }

  async function handleCreateCategory() {
    const name =
      newCategoryName.trim();

    if (!name) {
      return;
    }

    setMessage("");

    try {
      await createCategory(
        name,
      );

      setNewCategoryName("");

      setMessage(
        "Категория добавлена.",
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Не удалось добавить категорию.",
      );
    }
  }

  async function handleDeleteCategory(
    categoryId: string,
  ) {
    const ok =
      window.confirm(
        "Удалить категорию?",
      );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await deleteCategory(
        categoryId,
      );

      setMessage(
        "Категория удалена.",
      );

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
      await updateOrderStatus(
        orderId,
        status,
      );

      setMessage(
        "Статус заказа обновлён.",
      );

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Не удалось обновить статус заказа.",
      );
    }
  }

  function updateShopForm(
    patch: Partial<ShopFormState>,
  ) {
    setShopForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function resetShopForm() {
    setShopForm(
      SHOP_FORM_INITIAL,
    );
    setMessage("");
  }

  function startEditShop(
    shop: AdminShop,
  ) {
    setActiveTab("shops");

    setShopForm({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description:
        shop.description || "",
      backgroundColor:
        shop.backgroundColor ||
        "#ffffff",
      textColor:
        shop.textColor ||
        "#000000",
      accentColor:
        shop.accentColor ||
        "#000000",
      isActive:
        shop.isActive,
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmitShop(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const name =
        shopForm.name.trim();

      const slug =
        shopForm.slug
          .trim()
          .toLowerCase();

      if (!name) {
        throw new Error(
          "Укажи название магазина.",
        );
      }

      if (!slug) {
        throw new Error(
          "Укажи slug магазина.",
        );
      }

      const payload = {
        name,
        slug,
        description:
          shopForm.description.trim(),
        backgroundColor:
          shopForm.backgroundColor,
        textColor:
          shopForm.textColor,
        accentColor:
          shopForm.accentColor,
        isActive:
          shopForm.isActive,
      };

      if (shopForm.id) {
        await updateShop(
          shopForm.id,
          payload,
        );

        setMessage(
          "Магазин обновлён.",
        );
      } else {
        await createShop(
          payload,
        );

        setMessage(
          "Магазин создан.",
        );
      }

      resetShopForm();

      await loadAdminData();
    } catch (error: any) {
      console.error(error);

      const backendMessage =
        error?.response
          ?.data?.message;

      setMessage(
        (Array.isArray(
          backendMessage,
        )
          ? backendMessage.join(
              " ",
            )
          : backendMessage) ||
          error?.message ||
          "Не удалось сохранить магазин.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteShop(
    shop: AdminShop,
  ) {
    if (shop.slug === "swagystan") {
      setMessage(
        "Основной магазин SWA6Y5TAN удалить нельзя.",
      );
      return;
    }

    const ok = window.confirm(
      `Удалить магазин "${shop.name}"? Товары из базы не удалятся.`,
    );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      await deleteShop(shop.id);

      if (shopForm.id === shop.id) {
        resetShopForm();
      }

      setMessage(
        "Магазин удалён.",
      );

      await loadAdminData();
    } catch (error: any) {
      console.error(error);

      const backendMessage =
        error?.response?.data?.message;

      setMessage(
        (Array.isArray(backendMessage)
          ? backendMessage.join(" ")
          : backendMessage) ||
          "Не удалось удалить магазин.",
      );
    }
  }

  const selectedProductShop =
    shops.find(
      (shop) =>
        shop.id ===
        form.shopId,
    );

  const selectedProductShopName =
    selectedProductShop?.name ||
    "ВЫБЕРИ МАГАЗИН";

  return (
    <div className="admin-page">
      <div className="container admin">
        <header className="admin-header">
          <div className="admin-header__eyebrow">
            ADMIN
          </div>

          <h1 className="admin-header__title">
            SWA6Y5TAN
          </h1>
        </header>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tabs__button ${
              activeTab ===
              "products"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "products",
              )
            }
          >
            Товары
          </button>

          <button
            type="button"
            className={`admin-tabs__button ${
              activeTab ===
              "shops"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "shops",
              )
            }
          >
            Магазины
          </button>

          <button
            type="button"
            className={`admin-tabs__button ${
              activeTab ===
              "catalog"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "catalog",
              )
            }
          >
            Каталог
          </button>

          <button
            type="button"
            className={`admin-tabs__button ${
              activeTab ===
              "orders"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "orders",
              )
            }
          >
            Заказы
          </button>
        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {loading ? (
          <div className="admin-box">
            ЗАГРУЗКА...
          </div>
        ) : (
          <>
            {activeTab ===
              "products" && (
              <div className="admin-stack">
                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      {form.id
                        ? "Изменить товар"
                        : "Новый товар"}
                    </h2>

                    <span className="admin-pill">
                      {
                        selectedProductShopName
                      }
                    </span>
                  </div>

                  <form
                    className="admin-form"
                    onSubmit={
                      handleSubmitProduct
                    }
                  >
                    <label className="admin-field">
                      <span>
                        Магазин
                      </span>

                      <select
                        value={
                          form.shopId
                        }
                        onChange={(
                          event,
                        ) => {
                          updateForm({
                            shopId:
                              event
                                .target
                                .value,
                          });

                          setProductSearch(
                            "",
                          );
                        }}
                      >
                        <option value="">
                          Выбери магазин
                        </option>

                        {shops.map(
                          (shop) => (
                            <option
                              key={
                                shop.id
                              }
                              value={
                                shop.id
                              }
                              disabled={
                                !shop.isActive
                              }
                            >
                              {shop.name}
                              {!shop.isActive
                                ? " — ВЫКЛ"
                                : ""}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="admin-field">
                      <span>
                        Название
                      </span>

                      <input
                        value={
                          form.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              name:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder="Например: Zip Hoodie"
                      />
                    </label>

                    <label className="admin-field">
                      <span>
                        Цена
                      </span>

                      <input
                        inputMode="numeric"
                        value={
                          form.price
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              price:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder="5900"
                      />
                    </label>

                    <label className="admin-field">
                      <span>
                        Описание
                      </span>

                      <textarea
                        value={
                          form.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              description:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder="Короткое описание"
                      />
                    </label>

                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={
                          form.inStock
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              inStock:
                                event
                                  .target
                                  .checked,
                            },
                          )
                        }
                      />

                      <span>
                        В наличии
                      </span>
                    </label>

                    <label className="admin-field">
                      <span>
                        Бренд
                      </span>

                      <select
                        value={
                          form.brandId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              brandId:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                      >
                        <option value="">
                          Выбери бренд
                        </option>

                        {brands.map(
                          (
                            brand,
                          ) => (
                            <option
                              key={
                                brand.id
                              }
                              value={
                                brand.id
                              }
                            >
                              {
                                brand.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="admin-field">
                      <span>
                        Категория
                      </span>

                      <select
                        value={
                          form.categoryId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              categoryId:
                                event
                                  .target
                                  .value,
                            },
                          )
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

                    <label className="admin-field">
                      <span>
                        Размеры
                      </span>

                      <textarea
                        value={
                          form.sizesText
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            {
                              sizesText:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder={
                          "S\nM\nL\nXL"
                        }
                      />
                    </label>

                    <div className="admin-media-field">
                      <span className="admin-media-field__label">
                        Фото
                      </span>

                      <label className="admin-upload-btn">
                        ВЫБРАТЬ ФОТО

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            handleProductFiles(
                              event.target.files,
                            );

                            event.target.value =
                              "";
                          }}
                        />
                      </label>

                      <div className="admin-media-note">
                        До 10 фото. Можно выбрать сразу несколько из медиатеки.
                      </div>

                      {productImages.length > 0 && (
                        <div className="admin-product-images">
                          {productImages.map(
                            (item) => (
                              <div
                                className="admin-product-image"
                                key={item.key}
                              >
                                <img
                                  src={
                                    item.type === "url"
                                      ? item.url
                                      : item.previewUrl
                                  }
                                  alt="Фото товара"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeProductImage(
                                      item.key,
                                    )
                                  }
                                  aria-label="Удалить фото"
                                >
                                  ×
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    <div className="admin-actions">
                      <button
                        type="submit"
                        className="admin-btn admin-btn--primary"
                        disabled={
                          saving
                        }
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
                        onClick={
                          resetForm
                        }
                      >
                        ОЧИСТИТЬ
                      </button>
                    </div>
                  </form>
                </section>

                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      Товары — {
                        selectedProductShopName
                      }
                    </h2>

                    <span className="admin-pill">
                      {
                        filteredProducts.length
                      }
                    </span>
                  </div>

                  <input
                    className="admin-search"
                    placeholder="Поиск товара"
                    value={
                      productSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setProductSearch(
                        event.target
                          .value,
                      )
                    }
                  />

                  <div className="admin-transfer">
                    <div className="admin-transfer__label">
                      ПЕРЕТАЩИ ТОВАР В МАГАЗИН
                    </div>

                    <div className="admin-drop-shops">
                      {shops
                        .filter(
                          (shop) =>
                            shop.isActive,
                        )
                        .map((shop) => (
                          <div
                            className={`admin-drop-shop ${
                              dragOverShopId ===
                              shop.id
                                ? "is-over"
                                : ""
                            } ${
                              form.shopId ===
                              shop.id
                                ? "is-current"
                                : ""
                            }`}
                            key={shop.id}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverShopId(
                                shop.id,
                              );
                            }}
                            onDragLeave={() =>
                              setDragOverShopId(
                                null,
                              )
                            }
                            onDrop={(event) =>
                              void handleDropProduct(
                                shop.id,
                                event,
                              )
                            }
                          >
                            {shop.name}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="admin-list">
                    {filteredProducts.map(
                      (
                        product,
                      ) => (
                        <article
                          className={`admin-item ${
                            draggingProductId ===
                            product.id
                              ? "is-dragging"
                              : ""
                          }`}
                          key={
                            product.id
                          }
                          draggable
                          onDragStart={(event) => {
                            setDraggingProductId(
                              product.id,
                            );

                            event.dataTransfer.effectAllowed =
                              "move";

                            event.dataTransfer.setData(
                              "text/product-id",
                              product.id,
                            );
                          }}
                          onDragEnd={() => {
                            setDraggingProductId(
                              null,
                            );
                            setDragOverShopId(
                              null,
                            );
                          }}
                        >
                          <div className="admin-item__media">
                            {product
                              .images[0] ? (
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
                              <div className="admin-item__placeholder">
                                NO PHOTO
                              </div>
                            )}
                          </div>

                          <div className="admin-item__body">
                            <h3>
                              {
                                product.name
                              }
                            </h3>

                            <div className="admin-item__meta">
                              <span>
                                {formatPrice(
                                  product.price,
                                )}
                              </span>

                              <span>
                                {product
                                  .brand
                                  ?.name ||
                                  "—"}
                              </span>

                              <span>
                                {product
                                  .category
                                  ?.name ||
                                  "—"}
                              </span>

                              <span>
                                {product
                                  .shop
                                  ?.name ||
                                  "—"}
                              </span>
                            </div>

                            <label className="admin-move-select">
                              <span>
                                ПЕРЕНЕСТИ В
                              </span>

                              <select
                                value={
                                  product.shop?.id ||
                                  ""
                                }
                                onChange={(event) =>
                                  void handleMoveProduct(
                                    product.id,
                                    event.target.value,
                                  )
                                }
                              >
                                {shops
                                  .filter(
                                    (shop) =>
                                      shop.isActive,
                                  )
                                  .map((shop) => (
                                    <option
                                      key={shop.id}
                                      value={shop.id}
                                    >
                                      {shop.name}
                                    </option>
                                  ))}
                              </select>
                            </label>

                            <div className="admin-item__buttons">
                              <button
                                type="button"
                                className="admin-btn"
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
                                className="admin-btn admin-btn--danger"
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

                    {filteredProducts.length ===
                      0 && (
                      <div className="admin-empty">
                        Товаров не найдено
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab ===
              "shops" && (
              <div className="admin-stack">
                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      {shopForm.id
                        ? "Изменить магазин"
                        : "Новый магазин"}
                    </h2>

                    <span className="admin-pill">
                      {shopForm.id
                        ? "EDIT"
                        : "NEW"}
                    </span>
                  </div>

                  <form
                    className="admin-form"
                    onSubmit={
                      handleSubmitShop
                    }
                  >
                    <label className="admin-field">
                      <span>
                        Название
                      </span>

                      <input
                        value={
                          shopForm.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateShopForm(
                            {
                              name:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder="NORTH SIDE"
                      />
                    </label>

                    <label className="admin-field">
                      <span>
                        Slug / ссылка
                      </span>

                      <input
                        value={
                          shopForm.slug
                        }
                        onChange={(
                          event,
                        ) =>
                          updateShopForm(
                            {
                              slug:
                                event
                                  .target
                                  .value
                                  .toLowerCase(),
                            },
                          )
                        }
                        placeholder="north-side"
                        autoCapitalize="none"
                      />
                    </label>

                    <div className="admin-shop-path">
                      /shop/
                      {shopForm.slug ||
                        "north-side"}
                    </div>

                    <label className="admin-field">
                      <span>
                        Описание
                      </span>

                      <textarea
                        value={
                          shopForm.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateShopForm(
                            {
                              description:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder="Коротко о магазине"
                      />
                    </label>

                    <div className="admin-colors">
                      <label className="admin-color">
                        <span>
                          Фон
                        </span>

                        <div className="admin-color__row">
                          <input
                            type="color"
                            value={
                              shopForm.backgroundColor
                            }
                            onChange={(
                              event,
                            ) =>
                              updateShopForm(
                                {
                                  backgroundColor:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                          />

                          <strong>
                            {
                              shopForm.backgroundColor
                            }
                          </strong>
                        </div>
                      </label>

                      <label className="admin-color">
                        <span>
                          Текст
                        </span>

                        <div className="admin-color__row">
                          <input
                            type="color"
                            value={
                              shopForm.textColor
                            }
                            onChange={(
                              event,
                            ) =>
                              updateShopForm(
                                {
                                  textColor:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                          />

                          <strong>
                            {
                              shopForm.textColor
                            }
                          </strong>
                        </div>
                      </label>

                      <label className="admin-color">
                        <span>
                          Акцент
                        </span>

                        <div className="admin-color__row">
                          <input
                            type="color"
                            value={
                              shopForm.accentColor
                            }
                            onChange={(
                              event,
                            ) =>
                              updateShopForm(
                                {
                                  accentColor:
                                    event
                                      .target
                                      .value,
                                },
                              )
                            }
                          />

                          <strong>
                            {
                              shopForm.accentColor
                            }
                          </strong>
                        </div>
                      </label>
                    </div>

                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={
                          shopForm.isActive
                        }
                        onChange={(
                          event,
                        ) =>
                          updateShopForm(
                            {
                              isActive:
                                event
                                  .target
                                  .checked,
                            },
                          )
                        }
                      />

                      <span>
                        Магазин активен
                      </span>
                    </label>

                    <div className="admin-actions">
                      <button
                        type="submit"
                        className="admin-btn admin-btn--primary"
                        disabled={
                          saving
                        }
                      >
                        {saving
                          ? "СОХРАНЯЮ..."
                          : shopForm.id
                            ? "ОБНОВИТЬ"
                            : "СОЗДАТЬ"}
                      </button>

                      <button
                        type="button"
                        className="admin-btn"
                        onClick={
                          resetShopForm
                        }
                      >
                        ОЧИСТИТЬ
                      </button>
                    </div>
                  </form>
                </section>

                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      Магазины
                    </h2>

                    <span className="admin-pill">
                      {shops.length}
                    </span>
                  </div>

                  <div className="admin-shop-list">
                    {shops.map(
                      (shop) => (
                        <article
                          className="admin-shop-item"
                          key={
                            shop.id
                          }
                        >
                          <div className="admin-shop-item__top">
                            <div>
                              <h3>
                                {
                                  shop.name
                                }
                              </h3>

                              <div className="admin-shop-path">
                                /shop/
                                {
                                  shop.slug
                                }
                              </div>
                            </div>

                            <span className="admin-pill">
                              {shop.isActive
                                ? "ON"
                                : "OFF"}
                            </span>
                          </div>

                          <div className="admin-shop-item__meta">
                            <span>
                              {
                                shop.productCount
                              }{" "}
                              товаров
                            </span>

                            <span>
                              BG{" "}
                              {
                                shop.backgroundColor
                              }
                            </span>

                            <span>
                              TEXT{" "}
                              {
                                shop.textColor
                              }
                            </span>
                          </div>

                          <div className="admin-shop-actions">
                            <button
                              type="button"
                              className="admin-btn"
                              onClick={() =>
                                startEditShop(
                                  shop,
                                )
                              }
                            >
                              ИЗМЕНИТЬ
                            </button>

                            <a
                              className="admin-btn admin-shop-open"
                              href={`/shop/${shop.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              ОТКРЫТЬ
                            </a>

                            {shop.slug !== "swagystan" && (
                              <button
                                type="button"
                                className="admin-btn admin-btn--delete"
                                onClick={() =>
                                  void handleDeleteShop(
                                    shop,
                                  )
                                }
                              >
                                УДАЛИТЬ
                              </button>
                            )}
                          </div>
                        </article>
                      ),
                    )}

                    {shops.length ===
                      0 && (
                      <div className="admin-empty">
                        Магазинов пока нет
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab ===
              "catalog" && (
              <div className="admin-stack">
                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      Бренды
                    </h2>

                    <span className="admin-pill">
                      {
                        brands.length
                      }
                    </span>
                  </div>

                  <div className="admin-inline">
                    <input
                      value={
                        newBrandName
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewBrandName(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Новый бренд"
                    />

                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={
                        handleCreateBrand
                      }
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-tags">
                    {brands.map(
                      (
                        brand,
                      ) => (
                        <div
                          className="admin-tag"
                          key={
                            brand.id
                          }
                        >
                          <span>
                            {
                              brand.name
                            }
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
                      ),
                    )}
                  </div>
                </section>

                <section className="admin-box">
                  <div className="admin-box__head">
                    <h2>
                      Категории
                    </h2>

                    <span className="admin-pill">
                      {
                        categories.length
                      }
                    </span>
                  </div>

                  <div className="admin-inline">
                    <input
                      value={
                        newCategoryName
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewCategoryName(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Новая категория"
                    />

                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={
                        handleCreateCategory
                      }
                    >
                      ДОБАВИТЬ
                    </button>
                  </div>

                  <div className="admin-tags">
                    {categories.map(
                      (
                        category,
                      ) => (
                        <div
                          className="admin-tag"
                          key={
                            category.id
                          }
                        >
                          <span>
                            {
                              category.name
                            }
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
                </section>
              </div>
            )}

            {activeTab ===
              "orders" && (
              <div className="admin-stack">
                {orders.map(
                  (
                    order,
                  ) => (
                    <section
                      className="admin-box"
                      key={
                        order.id
                      }
                    >
                      <div className="admin-box__head admin-box__head--order">
                        <div>
                          <h2>
                            Заказ #
                            {order.id.slice(
                              0,
                              8,
                            )}
                          </h2>

                          <div className="admin-order-date">
                            {formatDate(
                              order.createdAt,
                            )}
                          </div>
                        </div>

                        <select
                          className="admin-order-select"
                          value={
                            order.status
                          }
                          onChange={(
                            event,
                          ) =>
                            void handleChangeOrderStatus(
                              order.id,
                              event
                                .target
                                .value as AdminOrder["status"],
                            )
                          }
                        >
                          {ORDER_STATUSES.map(
                            (
                              status,
                            ) => (
                              <option
                                key={
                                  status
                                }
                                value={
                                  status
                                }
                              >
                                {
                                  status
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="admin-order-grid">
                        <div className="admin-order-block">
                          <div className="admin-order-label">
                            Клиент
                          </div>

                          <div>
                            {order.customerName ||
                              order
                                .user
                                ?.name ||
                              "—"}
                          </div>

                          <div>
                            {order.phone ||
                              order
                                .user
                                ?.phone ||
                              "—"}
                          </div>
                        </div>

                        <div className="admin-order-block">
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
                        {order.items.map(
                          (
                            item,
                          ) => (
                            <div
                              className="admin-order-item"
                              key={
                                item.id
                              }
                            >
                              <span>
                                {
                                  item
                                    .product
                                    .name
                                }
                              </span>

                              <span>
                                {
                                  item.size
                                }
                              </span>

                              <span>
                                ×
                                {
                                  item.quantity
                                }
                              </span>

                              <span>
                                {formatPrice(
                                  item.price,
                                )}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      {order.comment && (
                        <div className="admin-order-comment">
                          {
                            order.comment
                          }
                        </div>
                      )}
                    </section>
                  ),
                )}

                {orders.length ===
                  0 && (
                  <div className="admin-box">
                    ЗАКАЗОВ ПОКА НЕТ
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
