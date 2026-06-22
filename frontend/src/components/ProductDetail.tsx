import { useEffect, useRef, useState } from "react";
import type { Product } from "../types";
import { formatPrice } from "../utils";
import { useCart } from "../cart";

export function ProductDetail({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { add } = useCart();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0].size : null,
  );
  const [added, setAdded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setActiveImage(0);
    setSize(product.sizes.length === 1 ? product.sizes[0].size : null);
    setAdded(false);
    trackRef.current?.scrollTo({ left: 0 });
  }, [product.id, product.sizes]);

  const images = product.images;
  const previewImage = images[activeImage]?.url ?? images[0]?.url;

  function scrollToImage(index: number) {
    const track = trackRef.current;
    if (!track) return;

    const nextIndex = Math.max(0, Math.min(index, images.length - 1));
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior: "smooth" });
    setActiveImage(nextIndex);
  }

  function handleGalleryScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0 || images.length === 0) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeImage) {
      setActiveImage(index);
    }
  }

  function handleAdd() {
    if (!size) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: previewImage,
      size,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(onClose, 600);
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet detail">
        <button className="detail__close" onClick={onClose} aria-label="Закрыть">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7L7 17"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="detail__body">
          <div>
            <div className="detail__gallery">
              <div
                className="detail__track"
                ref={trackRef}
                onScroll={handleGalleryScroll}
              >
                {images.length > 0 ? (
                  images.map((img, i) => (
                    <div className="detail__slide" key={img.id}>
                      <img
                        src={img.url}
                        alt={i === 0 ? product.name : `${product.name} — фото ${i + 1}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="detail__slide">
                    <div className="media-fallback">SWA6Y5TAN</div>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <div className="detail__dots" aria-hidden={images.length <= 1}>
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        className={`detail__dot ${
                          i === activeImage ? "detail__dot--active" : ""
                        }`}
                        onClick={() => scrollToImage(i)}
                        aria-label={`Фото ${i + 1} из ${images.length}`}
                      />
                    ))}
                  </div>
                  <div className="detail__counter">
                    {activeImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`detail__thumb ${
                      i === activeImage ? "detail__thumb--active" : ""
                    }`}
                    onClick={() => scrollToImage(i)}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail__info">
            <div>
              <div className="detail__brand">{product.brand.name}</div>
              <h2 className="detail__name">{product.name}</h2>
            </div>
            <div className="detail__price">{formatPrice(product.price)}</div>
            {product.description && (
              <p className="detail__desc">{product.description}</p>
            )}

            <div>
              <div className="label">Размер</div>
              <div className="sizes">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`size ${size === s.size ? "size--active" : ""}`}
                    onClick={() => setSize(s.size)}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn"
              disabled={!product.inStock || !size || added}
              onClick={handleAdd}
            >
              {added
                ? "Добавлено ✓"
                : !product.inStock
                  ? "Нет в наличии"
                  : !size
                    ? "Выберите размер"
                    : "Добавить в корзину"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
