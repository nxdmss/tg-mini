import { useEffect, useMemo, useState } from "react";
import type { Product } from "../types";
import { useCart } from "../cart";
import { useFavorites } from "../favorites";
import { formatPrice, getProductDetailImage } from "../utils";
import { CartIcon } from "./CartIcon";
import { NumericText } from "./NumericText";
import "./ProductDetail.css";

type ProductDetailProps = {
  product: Product;
  onBack: () => void;
  onCartClick: () => void;
};

export function ProductDetail({ product, onBack, onCartClick }: ProductDetailProps) {
  const { add, count, ready } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [imageIndex, setImageIndex] = useState(0);
  const firstAvailableSize = useMemo(
    () => product.sizes.find((size) => size.stock > 0)?.size ?? "",
    [product.sizes],
  );
  const [selectedSize, setSelectedSize] = useState(firstAvailableSize);
  const [added, setAdded] = useState(false);
  const images = product.images ?? [];
  const currentImage = images[imageIndex]?.url ?? images[0]?.url ?? "";
  const detailImage = getProductDetailImage(currentImage);
  const selectedSizeData = product.sizes.find((size) => size.size === selectedSize);
  const canAdd = Boolean(ready && selectedSizeData && selectedSizeData.stock > 0);

  useEffect(() => {
    setImageIndex(0);
    setSelectedSize(product.sizes.find((size) => size.stock > 0)?.size ?? "");
    setAdded(false);
  }, [product.id, product.sizes]);

  function previousImage() {
    if (images.length > 1) setImageIndex((index) => index === 0 ? images.length - 1 : index - 1);
  }
  function nextImage() {
    if (images.length > 1) setImageIndex((index) => index === images.length - 1 ? 0 : index + 1);
  }
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onBack();
      if (event.key === "ArrowLeft" && images.length > 1) previousImage();
      if (event.key === "ArrowRight" && images.length > 1) nextImage();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function addToCart() {
    if (!selectedSizeData || selectedSizeData.stock <= 0) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0]?.url,
      size: selectedSizeData.size,
      quantity: 1,
      maxStock: selectedSizeData.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  const favorite = isFavorite(product.id);
  return (
    <main className="product-page">
      <header className="product-page__header">
        <button type="button" className="product-page__back" onClick={onBack} aria-label="Назад">‹</button>
        <button type="button" className="product-page__cart" onClick={onCartClick} aria-label="Открыть покупки">
          <CartIcon count={count} />
        </button>
      </header>

      <div className="product-page__content">
        <section className="product-page__gallery">
          {images.length > 1 && (
            <button type="button" className="product-page__arrow product-page__arrow--left" onClick={previousImage} aria-label="Предыдущее изображение">‹</button>
          )}
          <div className="product-page__image-box">
            <button
              type="button"
              className={`product-page__favorite-floating ${favorite ? "is-favorite" : ""}`}
              onClick={() => toggle(product.id)}
              aria-label={favorite ? "Убрать из избранного" : "В избранное"}
              aria-pressed={favorite}
              title={favorite ? "Убрать из избранного" : "В избранное"}
            >
              <img
                src={favorite ? "/icons/swag-heart-filled.svg" : "/icons/swag-heart-outline.svg"}
                alt=""
                aria-hidden="true"
              />
            </button>
            {currentImage ? <img className="product-page__image" src={detailImage} alt={product.name} onError={(event) => {
              if (detailImage !== currentImage && event.currentTarget.getAttribute("src") !== currentImage) {
                event.currentTarget.src = currentImage;
              }
            }} /> : (
              <div className="product-page__image-empty">SWA6Y5TAN</div>
            )}
          </div>
          {images.length > 1 && (
            <button type="button" className="product-page__arrow product-page__arrow--right" onClick={nextImage} aria-label="Следующее изображение">›</button>
          )}
          {images.length > 1 && (
            <div className="product-page__dots">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.id ?? index}
                  className={index === imageIndex ? "product-page__dot product-page__dot--active" : "product-page__dot"}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Фото ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
        <section className="product-page__info">
          <h1 className="product-page__name"><NumericText text={product.name} /></h1>
          <div className="product-page__price swag-num">{formatPrice(product.price)}</div>
          {product.description && <p className="product-page__description">{product.description}</p>}
          <div className="product-page__sizes">
            <div className="product-page__sizes-title">ВЫБЕРИТЕ РАЗМЕР</div>
            <div className="product-page__sizes-list">
              {product.sizes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.stock <= 0}
                  className={item.size === selectedSize ? "product-page__size product-page__size--active swag-num" : "product-page__size swag-num"}
                  onClick={() => setSelectedSize(item.size)}
                >{item.size}</button>
              ))}
            </div>
          </div>
          <button type="button" className="product-page__add" disabled={!canAdd} onClick={addToCart}>
            {added ? "ДОБАВЛЕНО" : canAdd ? "ДОБАВИТЬ В КОРЗИНУ" : "НЕТ В НАЛИЧИИ"}
          </button>
        </section>
      </div>
    </main>
  );
}
