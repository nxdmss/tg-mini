import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Product } from "../types";

import { useCart } from "../cart";
import { formatPrice } from "../utils";

import "./ProductDetail.css";

type ProductDetailProps = {
  product: Product;
  onBack: () => void;
  onCartClick: () => void;
};

export function ProductDetail({
  product,
  onBack,
  onCartClick,
}: ProductDetailProps) {
  const {
    add,
    count,
  } = useCart();

  const [
    imageIndex,
    setImageIndex,
  ] = useState(0);

  const firstAvailableSize =
    useMemo(
      () =>
        product.sizes.find(
          (size) =>
            size.stock > 0,
        )?.size ?? "",
      [product.sizes],
    );

  const [
    selectedSize,
    setSelectedSize,
  ] = useState(
    firstAvailableSize,
  );

  const [
    added,
    setAdded,
  ] =
    useState(false);

  const images =
    product.images ?? [];

  const currentImage =
    images[imageIndex]?.url ??
    images[0]?.url ??
    "";

  const selectedSizeData =
    product.sizes.find(
      (size) =>
        size.size ===
        selectedSize,
    );

  const canAdd =
    Boolean(
      selectedSizeData &&
        selectedSizeData.stock >
          0,
    );

  useEffect(() => {
    setImageIndex(0);

    setSelectedSize(
      product.sizes.find(
        (size) =>
          size.stock > 0,
      )?.size ?? "",
    );

    setAdded(false);
  }, [
    product.id,
    product.sizes,
  ]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onBack();
      }

      if (
        event.key ===
          "ArrowLeft" &&
        images.length > 1
      ) {
        previousImage();
      }

      if (
        event.key ===
          "ArrowRight" &&
        images.length > 1
      ) {
        nextImage();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  });

  function previousImage() {
    if (
      images.length <= 1
    ) {
      return;
    }

    setImageIndex(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1,
    );
  }

  function nextImage() {
    if (
      images.length <= 1
    ) {
      return;
    }

    setImageIndex(
      (current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1,
    );
  }

  function addToCart() {
    if (
      !selectedSizeData ||
      selectedSizeData.stock <=
        0
    ) {
      return;
    }

    add({
      productId:
        product.id,

      name:
        product.name,

      price:
        product.price,

      image:
        images[0]?.url,

      size:
        selectedSizeData.size,

      quantity:
        1,

      maxStock:
        selectedSizeData.stock,
    });

    setAdded(true);

    window.setTimeout(
      () => {
        setAdded(false);
      },
      1200,
    );
  }

  return (
    <main className="product-page">
      <header className="product-page__header">
        <button
          type="button"
          className="product-page__back"
          onClick={onBack}
          aria-label="Назад"
        >
          ‹
        </button>

        <button
          type="button"
          className="product-page__cart"
          onClick={
            onCartClick
          }
        >
          КОРЗИНА

          {count > 0 && (
            <span>
              {count}
            </span>
          )}
        </button>
      </header>

      <div className="product-page__content">
        <section className="product-page__gallery">
          {images.length >
            1 && (
            <button
              type="button"
              className="product-page__arrow product-page__arrow--left"
              onClick={
                previousImage
              }
              aria-label="Предыдущее изображение"
            >
              ‹
            </button>
          )}

          <div className="product-page__image-box">
            {currentImage ? (
              <img
                className="product-page__image"
                src={
                  currentImage
                }
                alt={
                  product.name
                }
              />
            ) : (
              <div className="product-page__image-empty">
                SWA6Y5TAN
              </div>
            )}
          </div>

          {images.length >
            1 && (
            <button
              type="button"
              className="product-page__arrow product-page__arrow--right"
              onClick={
                nextImage
              }
              aria-label="Следующее изображение"
            >
              ›
            </button>
          )}

          {images.length >
            1 && (
            <div className="product-page__dots">
              {images.map(
                (
                  image,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      image.id ??
                      index
                    }
                    className={
                      index ===
                      imageIndex
                        ? "product-page__dot product-page__dot--active"
                        : "product-page__dot"
                    }
                    onClick={() =>
                      setImageIndex(
                        index,
                      )
                    }
                    aria-label={`Фото ${
                      index + 1
                    }`}
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section className="product-page__info">
          <h1 className="product-page__name">
            {product.name}
          </h1>

          <div className="product-page__price">
            {formatPrice(
              product.price,
            )}
          </div>

          {product.description && (
            <p className="product-page__description">
              {
                product.description
              }
            </p>
          )}

          <div className="product-page__sizes">
            <div className="product-page__sizes-title">
              ВЫБЕРИТЕ РАЗМЕР
            </div>

            <div className="product-page__sizes-list">
              {product.sizes.map(
                (item) => {
                  const soldOut =
                    item.stock <=
                    0;

                  const active =
                    item.size ===
                    selectedSize;

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      disabled={
                        soldOut
                      }
                      className={
                        active
                          ? "product-page__size product-page__size--active"
                          : "product-page__size"
                      }
                      onClick={() =>
                        setSelectedSize(
                          item.size,
                        )
                      }
                    >
                      {
                        item.size
                      }
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <button
            type="button"
            className="product-page__add"
            disabled={!canAdd}
            onClick={
              addToCart
            }
          >
            {added
              ? "ДОБАВЛЕНО"
              : canAdd
                ? "ДОБАВИТЬ В КОРЗИНУ"
                : "НЕТ В НАЛИЧИИ"}
          </button>
        </section>
      </div>
    </main>
  );
}