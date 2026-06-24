import { useEffect, useRef, useState, type TouchEvent } from "react";
import type { Product } from "../types";
import { formatPrice } from "../utils";
import { useCart } from "../cart";

type DragState = {
  startY: number;
  startX: number;
  axis: "x" | "y" | null;
};

export function ProductDetail({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { add } = useCart();
  const trackRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({ startY: 0, startX: 0, axis: null });
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0].size : null,
  );
  const [added, setAdded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    setDragY(0);
    setLightboxOpen(false);
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

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function handleSheetTouchStart(event: TouchEvent) {
    if (lightboxOpen) return;

    const touch = event.touches[0];
    dragRef.current = {
      startY: touch.clientY,
      startX: touch.clientX,
      axis: null,
    };
    setIsDragging(true);
  }

  function handleSheetTouchMove(event: TouchEvent) {
    if (lightboxOpen || !isDragging) return;

    const touch = event.touches[0];
    const deltaY = touch.clientY - dragRef.current.startY;
    const deltaX = touch.clientX - dragRef.current.startX;

    if (!dragRef.current.axis) {
      if (Math.abs(deltaY) < 8 && Math.abs(deltaX) < 8) return;
      dragRef.current.axis = Math.abs(deltaY) > Math.abs(deltaX) ? "y" : "x";
    }

    if (dragRef.current.axis === "y" && deltaY > 0) {
      event.preventDefault();
      setDragY(deltaY);
    }
  }

  function handleSheetTouchEnd() {
    if (dragRef.current.axis === "y" && dragY > 110) {
      onClose();
    }

    setDragY(0);
    setIsDragging(false);
    dragRef.current.axis = null;
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

  const sheetStyle = {
    transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: isDragging ? "none" : undefined,
  };

  return (
    <>
      <div
        className="overlay"
        onClick={onClose}
        style={{ opacity: dragY > 0 ? Math.max(0.12, 1 - dragY / 260) : undefined }}
      />
      <div
        ref={sheetRef}
        className="sheet detail"
        style={sheetStyle}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        onTouchCancel={handleSheetTouchEnd}
      >
        <div className="detail__handle" aria-hidden="true" />
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
                      <button
                        type="button"
                        className="detail__photo-btn"
                        onClick={() => openLightbox(i)}
                        aria-label={`Открыть фото ${i + 1} на весь экран`}
                      >
                        <img
                          src={img.url}
                          alt={i === 0 ? product.name : `${product.name} — фото ${i + 1}`}
                        />
                      </button>
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

      {lightboxOpen && images.length > 0 && (
        <div
          className="lightbox"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Фото товара"
        >
          <button
            type="button"
            className="lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7L7 17"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((index) => (index - 1 + images.length) % images.length);
                }}
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((index) => (index + 1) % images.length);
                }}
                aria-label="Следующее фото"
              >
                ›
              </button>
              <div className="lightbox__counter">
                {lightboxIndex + 1} / {images.length}
              </div>
            </>
          )}
          <img
            className="lightbox__image"
            src={images[lightboxIndex]?.url}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
