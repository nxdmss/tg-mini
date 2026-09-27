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

  style.textContent = `
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

    /*
     * New SWAGYSTAN lettering.
     * The wordmark is an SVG outline generated from the supplied font,
     * so it renders identically without shipping a font file.
     *
     * visibility:hidden keeps the original text box dimensions;
     * ::after paints the new wordmark exactly inside that same box.
     */
    .brand-swagystan {
      position: relative !important;
      visibility: hidden !important;
      white-space: nowrap !important;
      text-transform: none !important;
      letter-spacing: 0 !important;
      transform: none !important;
    }

    .brand-swagystan::after {
      content: "";
      position: absolute;
      inset: -0.08em -0.08em;
      visibility: visible !important;
      display: block;
      background-color: var(--text, #111);
      -webkit-mask-image: url("/swagystan-label.svg");
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
      mask-image: url("/swagystan-label.svg");
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      pointer-events: none;
    }

    @supports not (
      (-webkit-mask-image: url("/swagystan-label.svg")) or
      (mask-image: url("/swagystan-label.svg"))
    ) {
      .brand-swagystan {
        visibility: visible !important;
        font-family: "IBM Plex Mono", monospace !important;
        font-weight: 700 !important;
        font-style: italic !important;
      }

      .brand-swagystan::after {
        display: none !important;
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
      "SWAGYSTAN",
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
    /^(SWAGYSTAN|SWA6Y5TAN)$/i.test(
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
  const parent =
    node.parentElement;

  if (
    !parent ||
    parent.matches(
      "script, style, textarea",
    )
  ) {
    return;
  }

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
