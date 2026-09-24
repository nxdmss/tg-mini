const ZULF_RE = /\bZULF\b/gi;
const SWAG_RE = /\b(?:SWA6Y5TAN|SWAGYSTAN)\b/gi;

const STYLE_ID = "swagystan-brand-runtime-style";

function installBrandStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /*
     * Zulfia — handwritten / signature.
     * iPhone/macOS: Snell Roundhand.
     * Windows/Android: graceful script fallbacks.
     */
    .brand-zulfia {
      display: inline-block !important;
      font-family:
        "Snell Roundhand",
        "Segoe Script",
        "Brush Script MT",
        "URW Chancery L",
        cursive !important;
      font-size: 1.38em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.92 !important;
      letter-spacing: 0.01em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform: translateY(0.02em);
      transform-origin: center;
    }

    /*
     * SWAGYSTAN — DMC5 / Kalina Ann direction.
     * Wider, airier and more alive than the previous compressed version.
     */
    @font-face {
      font-family: "SWAGYSTAN DMC5";
      src:
        url("/fonts/dmc5-kalina-ann.woff2") format("woff2"),
        url("/fonts/dmc5-kalina-ann.woff") format("woff"),
        url("/fonts/dmc5-kalina-ann.ttf") format("truetype"),
        url("/fonts/dmc5-kalina-ann.otf") format("opentype");
      font-style: normal;
      font-weight: 400;
      font-display: swap;
    }

    .brand-swagystan {
      position: relative !important;
      display: inline-block !important;
      font-family:
        "SWAGYSTAN DMC5",
        "Bodoni 72",
        "Didot",
        "Times New Roman",
        serif !important;
      font-size: 1.38em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.98 !important;
      letter-spacing: 0.012em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform:
        skewX(-7deg)
        scaleX(1.12)
        scaleY(1.15)
        translateY(-0.055em);
      transform-origin: left center;
      -webkit-text-stroke: 0.08px currentColor;
      paint-order: stroke fill;
      text-shadow:
        0.006em 0.004em 0 currentColor;
      isolation: isolate;
    }

    .brand-swagystan::before,
    .brand-swagystan::after {
      content: attr(data-brand-word);
      position: absolute;
      inset: 0;
      color: currentColor;
      pointer-events: none;
      user-select: none;
      opacity: 0.14;
      z-index: -1;
    }

    .brand-swagystan::before {
      transform: translate(-0.016em, -0.012em);
      clip-path: polygon(
        0 0,
        100% 0,
        100% 47%,
        78% 43%,
        58% 48%,
        37% 43%,
        17% 48%,
        0 44%
      );
    }

    .brand-swagystan::after {
      transform: translate(0.018em, 0.014em);
      clip-path: polygon(
        0 56%,
        19% 52%,
        39% 57%,
        59% 52%,
        79% 57%,
        100% 53%,
        100% 100%,
        0 100%
      );
    }

    @media (max-width: 700px) {
      .brand-zulfia {
        font-size: 1.32em !important;
      }

      .brand-swagystan {
        font-size: 1.34em !important;
        letter-spacing: 0.01em !important;
        transform:
          skewX(-6deg)
          scaleX(1.10)
          scaleY(1.13)
          translateY(-0.045em);
      }
    }
  `;

  document.head.appendChild(style);
}

function normalizeText(value: string) {
  return value
    .replace(ZULF_RE, "Zulfia")
    .replace(SWAG_RE, "swagystan");
}

function classForText(value: string) {
  const normalized = value.trim();

  if (/^Zulfia$/i.test(normalized)) {
    return "brand-zulfia";
  }

  if (/^(swagystan|SWA6Y5TAN)$/i.test(normalized)) {
    return "brand-swagystan";
  }

  return null;
}

function normalizeAttributes(element: HTMLElement) {
  const attributes = [
    "aria-label",
    "title",
    "placeholder",
    "alt",
  ];

  for (const name of attributes) {
    const current = element.getAttribute(name);

    if (!current) {
      continue;
    }

    const next = normalizeText(current);

    if (next !== current) {
      element.setAttribute(name, next);
    }
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const next = normalizeText(element.value);

    if (next !== element.value) {
      element.value = next;
    }
  }
}

function normalizeTextNode(node: Text) {
  const current = node.nodeValue ?? "";
  const next = normalizeText(current);

  if (next !== current) {
    node.nodeValue = next;
  }

  const parent = node.parentElement;

  if (!parent) {
    return;
  }

  const brandClass = classForText(parent.textContent ?? "");

  if (brandClass) {
    parent.classList.add(brandClass);

    if (brandClass === "brand-zulfia") {
      parent.classList.remove("brand-swagystan");
    } else {
      parent.classList.remove("brand-zulfia");
      parent.setAttribute("data-brand-word", "swagystan");
    }
  }
}

function normalizeElement(root: ParentNode) {
  if (root instanceof HTMLElement) {
    normalizeAttributes(root);
  }

  const elements = root.querySelectorAll?.<HTMLElement>("*");

  elements?.forEach((element) => {
    normalizeAttributes(element);

    const brandClass = classForText(element.textContent ?? "");

    /*
     * Apply typography to leaf-ish nodes only.
     * This avoids skewing a whole layout/container.
     */
    if (
      brandClass &&
      element.children.length === 0
    ) {
      element.classList.add(brandClass);

      if (brandClass === "brand-zulfia") {
        element.classList.remove("brand-swagystan");
      } else {
        element.classList.remove("brand-zulfia");
        element.setAttribute("data-brand-word", "swagystan");
      }
    }
  });

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  const nodes: Text[] = [];

  let current = walker.nextNode();

  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  nodes.forEach(normalizeTextNode);
}

function normalizeDocumentTitle() {
  document.title = normalizeText(document.title)
    .replace(/swagystan/gi, "SWAGYSTAN");
}

function run() {
  installBrandStyles();
  normalizeDocumentTitle();
  normalizeElement(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        normalizeTextNode(mutation.target as Text);
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          normalizeTextNode(node as Text);
          return;
        }

        if (node instanceof HTMLElement) {
          normalizeElement(node);
        }
      });
    }

    normalizeDocumentTitle();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run, {
    once: true,
  });
} else {
  run();
}
