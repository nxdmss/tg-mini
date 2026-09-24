const ZULF_RE =
  /\bZULF\b/gi;

const SWAG_RE =
  /\b(?:SWA6Y5TAN|SWAGYSTAN)\b/gi;

const STYLE_ID =
  "swagystan-brand-runtime-style";

function installBrandStyles() {
  if (
    document.getElementById(
      STYLE_ID,
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style",
    );

  style.id = STYLE_ID;

  /*
   * Typography/text safety net only.
   * Never changes layout.
   *
   * ShopSwitcher has its own intentionally sized brand styles,
   * so runtime branding must not stack on top of it.
   */
  style.textContent = `
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

    .brand-zulfia {
      display: inline-block !important;
      font-family:
        "Snell Roundhand",
        "Segoe Script",
        "Brush Script MT",
        "URW Chancery L",
        cursive !important;
      font-size: 1.79em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.92 !important;
      letter-spacing: -0.006em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform: translateY(0.02em);
      transform-origin: center;
    }

    .brand-swagystan {
      display: inline-block !important;
      font-family:
        "SWAGYSTAN DMC5",
        "Bodoni 72",
        "Didot",
        "Times New Roman",
        serif !important;
      font-size: 1.92em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.7 !important;
      letter-spacing: -0.1em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform:
        skewX(-6deg)
        scaleX(1.12)
        scaleY(1.2)
        translateY(-0.075em);
      transform-origin: left center;
      -webkit-text-stroke:
        0.04px currentColor;
    }

    @media (max-width: 700px) {
      .brand-swagystan {
        font-size: 2em !important;
        letter-spacing: -0.095em !important;
      }
    }
  `;

  document.head.appendChild(
    style,
  );
}

function normalizeText(
  value: string,
) {
  return value
    .replace(
      ZULF_RE,
      "Zulfia",
    )
    .replace(
      SWAG_RE,
      "swagystan",
    );
}

function classForText(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    /^Zulfia$/i.test(
      normalized,
    )
  ) {
    return "brand-zulfia";
  }

  if (
    /^(swagystan|SWA6Y5TAN)$/i.test(
      normalized,
    )
  ) {
    return "brand-swagystan";
  }

  return null;
}

function normalizeAttributes(
  element: HTMLElement,
) {
  const attributes = [
    "aria-label",
    "title",
    "placeholder",
    "alt",
  ];

  for (
    const name of attributes
  ) {
    const current =
      element.getAttribute(
        name,
      );

    if (!current) {
      continue;
    }

    const next =
      normalizeText(
        current,
      );

    if (
      next !== current
    ) {
      element.setAttribute(
        name,
        next,
      );
    }
  }
}

function normalizeTextNode(
  node: Text,
) {
  const current =
    node.nodeValue ?? "";

  const next =
    normalizeText(
      current,
    );

  if (
    next !== current
  ) {
    node.nodeValue = next;
  }

  const parent =
    node.parentElement;

  if (
    !parent ||
    parent.closest(
      ".shop-switcher",
    )
  ) {
    return;
  }

  const brandClass =
    classForText(
      parent.textContent ?? "",
    );

  if (
    !brandClass ||
    parent.children.length > 0
  ) {
    return;
  }

  parent.classList.add(
    brandClass,
  );

  if (
    brandClass ===
      "brand-zulfia"
  ) {
    parent.classList.remove(
      "brand-swagystan",
    );
  } else {
    parent.classList.remove(
      "brand-zulfia",
    );
  }
}

function normalizeElement(
  root: ParentNode,
) {
  if (
    root instanceof HTMLElement
  ) {
    normalizeAttributes(
      root,
    );
  }

  const elements =
    root.querySelectorAll?.<HTMLElement>(
      "*",
    );

  elements?.forEach(
    (element) => {
      normalizeAttributes(
        element,
      );
    },
  );

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    );

  const nodes: Text[] = [];

  let current =
    walker.nextNode();

  while (current) {
    nodes.push(
      current as Text,
    );
    current =
      walker.nextNode();
  }

  nodes.forEach(
    normalizeTextNode,
  );
}

function normalizeDocumentTitle() {
  document.title =
    normalizeText(
      document.title,
    ).replace(
      /swagystan/gi,
      "SWAGYSTAN",
    );
}

function run() {
  installBrandStyles();
  normalizeDocumentTitle();
  normalizeElement(
    document.body,
  );

  const observer =
    new MutationObserver(
      (mutations) => {
        for (
          const mutation
          of mutations
        ) {
          if (
            mutation.type ===
              "characterData"
          ) {
            normalizeTextNode(
              mutation.target as Text,
            );
            continue;
          }

          mutation.addedNodes.forEach(
            (node) => {
              if (
                node.nodeType ===
                  Node.TEXT_NODE
              ) {
                normalizeTextNode(
                  node as Text,
                );
                return;
              }

              if (
                node instanceof
                  HTMLElement
              ) {
                normalizeElement(
                  node,
                );
              }
            },
          );
        }

        normalizeDocumentTitle();
      },
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
      characterData: true,
    },
  );
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    run,
    {
      once: true,
    },
  );
} else {
  run();
}
