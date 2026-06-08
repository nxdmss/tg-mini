import { useEffect, useState } from "react";
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

  const image = product.images[activeImage]?.url ?? product.images[0]?.url;

  function handleAdd() {
    if (!size) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
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
          ✕
        </button>
        <div className="detail__body">
          <div>
            <div className="detail__media">
              {image && <img src={image} alt={product.name} />}
            </div>
            {product.images.length > 1 && (
              <div className="detail__thumbs">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    className={`detail__thumb ${
                      i === activeImage ? "detail__thumb--active" : ""
                    }`}
                    onClick={() => setActiveImage(i)}
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
