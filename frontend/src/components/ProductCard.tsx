import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "../types";
import {
  formatPrice,
  getProductPreviewImage,
  getProductPreviewSrcSet,
} from "../utils";
import { onCardNearViewport, preloadHoverImage } from "../hoverImageCache";
import { NumericText } from "./NumericText";
import "./ProductCardHover.css";

const IMAGE_SIZES = "(max-width: 699px) 50vw, (max-width: 1019px) 33vw, 25vw";

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
  const hasAlternate = Boolean(
    product.images[1]?.url && product.images[1].url !== product.images[0]?.url,
  );
  const alternateImage = hasAlternate ? getProductPreviewImage(product, 1) : undefined;
  const alternateSrcSet = hasAlternate ? getProductPreviewSrcSet(product, 1) : undefined;
  const [hovering, setHovering] = useState(false);
  const [readyImage, setReadyImage] = useState<string | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  const alternateReady = Boolean(alternateImage && readyImage === alternateImage);
  const alternateFailed = Boolean(alternateImage && failedImage === alternateImage);
  const showAlternate = hovering && alternateReady && !alternateFailed;
  const isDesktop = window.innerWidth >= 768;
  const eagerCount = isDesktop ? 8 : 4;
  const highPriorityCount = isDesktop ? 4 : 2;

  useEffect(() => {
    if (!alternateImage || !cardRef.current ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    let mounted = true;
    let timeout: number | undefined;
    const unsubscribe = onCardNearViewport(cardRef.current, () => {
      // Let visible primary images and the intro finish before idle preloads.
      timeout = window.setTimeout(() => {
        void preloadHoverImage(alternateImage, alternateSrcSet, IMAGE_SIZES)
          .then((success) => {
            if (!mounted) return;
            if (success) setReadyImage(alternateImage);
            else setFailedImage(alternateImage);
          });
      }, 300);
    });

    return () => {
      mounted = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [alternateImage, alternateSrcSet]);

  function startPreview() {
    if (!alternateImage || alternateFailed) return;
    setHovering(true);
    if (!alternateReady) {
      void preloadHoverImage(alternateImage, alternateSrcSet, IMAGE_SIZES, true)
        .then((success) => {
          if (success) setReadyImage(alternateImage);
          else setFailedImage(alternateImage);
        });
    }
  }

  const displayedImage = showAlternate ? alternateImage : image;
  const displayedSrcSet = showAlternate ? alternateSrcSet : srcSet;

  return (
    <button
      ref={cardRef}
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
        {image && displayedImage ? (
          <span className="card__image-stack">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={`${product.id}:${displayedImage}`}
                className={showAlternate ? "card__image--alternate" : "card__image--primary"}
                src={displayedImage}
                srcSet={displayedSrcSet}
                sizes={IMAGE_SIZES}
                alt={showAlternate ? `${product.name} на модели` : product.name}
                loading={showAlternate || index < eagerCount ? "eager" : "lazy"}
                fetchPriority={showAlternate || index < highPriorityCount ? "high" : "auto"}
                decoding="async"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.20, ease: [0.25, 0.1, 0.25, 1] }}
                onError={() => {
                  if (showAlternate && alternateImage) setFailedImage(alternateImage);
                }}
              />
            </AnimatePresence>
          </span>
        ) : (
          <div className="media-fallback">SWA6Y5TAN</div>
        )}

        {!product.inStock && (
          <>
            <span className="card__sold-out-mask" aria-hidden="true" />
            <span className="card__sold-out-stamp">SOLD OUT</span>
          </>
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
