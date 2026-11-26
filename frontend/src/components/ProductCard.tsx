import { useEffect, useRef, useState } from "react";

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

    >
      <div className="card__media">
        {image && displayedImage ? (
          <span className="card__image-stack">
              <img
                key={`${product.id}:${displayedImage}`}
                className={showAlternate ? "card__image--alternate" : "card__image--primary"}
                src={displayedImage}
                srcSet={displayedSrcSet}
                sizes={IMAGE_SIZES}
                alt={showAlternate ? `${product.name} на модели` : product.name}
                loading={showAlternate || index < eagerCount ? "eager" : "lazy"}
                fetchPriority={showAlternate || index < highPriorityCount ? "high" : "auto"}
                decoding="async"
                onError={() => {
                  if (showAlternate && alternateImage) setFailedImage(alternateImage);
                }}
              />
          </span>
        ) : (
          <div className="media-fallback">SWA6Y5TAN</div>
        )}

        {!product.inStock && (
          <span className="card__sold-out-glitch" role="img" aria-label="Нет в наличии">
            <svg viewBox="0 0 320 400" preserveAspectRatio="none" aria-hidden="true">
              <g fill="#111">
                <path d="M0 115H71V118H119V109H165V113H223V104H320V121H258V126H182V121H112V131H53V125H0Z" />
                <path d="M0 186L55 183 55 177 122 179 122 170 190 174 190 166 254 169 254 160 320 163V181L278 179 278 190 219 188 219 194 143 190 143 201 74 195 74 204 0 201Z" />
                <path d="M0 247H34V242H100V249H156V237H232V241H280V231H320V246H301V254H237V249H173V260H83V253H0Z" />
                <path d="M0 284H92V281H141V288H209V278H320V284H249V293H173V286H81V292H0Z" />
              </g>
              <g fill="none" stroke="#111" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M-8 242L36 231 29 226 91 216 76 211 150 199 137 193 211 178 199 172 280 152 271 147 329 135" strokeWidth="5" />
                <path d="M-6 256L61 236 49 233 117 220 102 215 185 200 171 196 242 180 228 176 327 150" strokeWidth="2.2" />
                <path d="M4 105H59M82 135H174M198 130H310M0 208H48M70 211H146M214 205H320M0 265H91M113 269H194M232 263H314M20 301H122M155 298H270" strokeWidth="1.5" />
                <path d="M0 151H45M98 154H120M153 146H219M254 140H320M0 226H21M146 228H202M267 222H320M2 312H43M264 307H318" strokeWidth="3" />
              </g>
              <g fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="square" opacity=".95">
                <path d="M0 119H67L67 122H124M158 116H223V110H320M0 191H55V185H123M184 182H254V173H320M0 251H37V246H99M158 244H231V248H281V239H320M92 286H142V291H209" />
                <path d="M0 238L75 219 63 215 151 199 141 196 220 177 213 172 320 146" />
              </g>
            </svg>
          </span>
        )}

        <span className="card__overlay">
          <span className="card__cta">Открыть</span>
        </span>
      </div>

      <div className="card__body">
        <span className="card__name"><NumericText text={product.name} /></span>

        <div className="card__footer">
          <span className="card__price">{formatPrice(product.price).replace("₽", "")}<span className="card__ruble">₽</span></span>
        </div>
      </div>
    </button>
  );
}
