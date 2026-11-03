import { useState } from "react";
import type { Product } from "../types";
import {
  formatPrice,
  getProductPreviewImage,
  getProductPreviewSrcSet,
} from "../utils";
import { NumericText } from "./NumericText";
import "./ProductCardHover.css";

export function ProductCard({
  product,
  onClick,
  index = 0,
}: {
  product: Product;
  onClick: () => void;
  index?: number;
}) {
  const image = getProductPreviewImage(product);
  const srcSet = getProductPreviewSrcSet(product);
  // The second gallery image is the catalog's on-model hover slot.
  // No alternate image means the original image remains visible.
  const hasAlternate = Boolean(
    product.images[1]?.url && product.images[1].url !== product.images[0]?.url,
  );
  const alternateImage = hasAlternate ? getProductPreviewImage(product, 1) : undefined;
  const alternateSrcSet = hasAlternate ? getProductPreviewSrcSet(product, 1) : undefined;
  const [alternateRequested, setAlternateRequested] = useState(false);
  const [alternateLoaded, setAlternateLoaded] = useState(false);
  const [alternateFailed, setAlternateFailed] = useState(false);
  const [hovering, setHovering] = useState(false);

  function startPreview() {
    if (!hasAlternate || alternateFailed) return;
    setAlternateRequested(true);
    setHovering(true);
  }

  const showAlternate = hovering && alternateLoaded && !alternateFailed;

  const isDesktop = window.innerWidth >= 768;
  const eagerCount = isDesktop ? 8 : 4;
  const highPriorityCount = isDesktop ? 4 : 2;

  return (
    <button
      className="card"
      onClick={onClick}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          startPreview();
        }
      }}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          startPreview();
        }
      }}
      onBlur={() => setHovering(false)}
      style={{
        animationDelay: `${Math.min(index * 60, 480)}ms`,
      }}
    >
      <div className="card__media">
        {image ? (
          <span className={`card__image-stack${showAlternate ? " is-hovered" : ""}`}>
            <img
              className="card__image--primary"
              src={image}
              srcSet={srcSet}
              sizes="(max-width: 699px) 50vw, (max-width: 1019px) 33vw, 25vw"
              alt={product.name}
              loading={index < eagerCount ? "eager" : "lazy"}
              fetchPriority={index < highPriorityCount ? "high" : "auto"}
              decoding="async"
            />
            {alternateRequested && alternateImage && !alternateFailed && (
              <img
                className="card__image--alternate"
                src={alternateImage}
                srcSet={alternateSrcSet}
                sizes="(max-width: 699px) 50vw, (max-width: 1019px) 33vw, 25vw"
                alt=""
                aria-hidden="true"
                decoding="async"
                onLoad={() => setAlternateLoaded(true)}
                onError={() => setAlternateFailed(true)}
              />
            )}
          </span>
        ) : (
          <div className="media-fallback">SWA6Y5TAN</div>
        )}

        {!product.inStock && (
          <span className="tag-out">Нет в наличии</span>
        )}

        <span className="card__overlay">
          <span className="card__cta">Открыть</span>
        </span>
      </div>

      <div className="card__body">
        <span className="card__name"><NumericText text={product.name} /></span>
        <span className="card__brand"><NumericText text={product.brand.name} /></span>

        <div className="card__footer">
          <span className="card__price">{formatPrice(product.price).replace("₽", "")}<span className="card__ruble">₽</span></span>
          <span className="card__category"><NumericText text={product.category.name} /></span>
        </div>
      </div>
    </button>
  );
}
