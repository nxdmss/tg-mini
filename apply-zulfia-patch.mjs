import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const frontendSrc = path.join(root, "frontend", "src");

if (!fs.existsSync(frontendSrc)) {
  console.error("ERROR: frontend/src not found.");
  console.error("Put this patch into the root of tg-mini and run it there.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function backup(file) {
  const backupFile = `${file}.zulfia-backup`;
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
  }
}

const sourceFiles = walk(frontendSrc).filter((file) =>
  /\.(ts|tsx|css)$/.test(file)
);

const changed = new Set();

// 1) Replace hard-coded visual labels only.
// Lowercase slug "zulf" is intentionally untouched, so routes keep working.
for (const file of sourceFiles) {
  let text = fs.readFileSync(file, "utf8");
  const next = text.replace(/\bZULF\b/g, "Zulfia");

  if (next !== text) {
    backup(file);
    fs.writeFileSync(file, next, "utf8");
    changed.add(path.relative(root, file));
  }
}

// 2) Make dynamic shop.name displays show Zulfia for slug "zulf".
// This keeps the backend slug/database relation intact.
const tsxFiles = sourceFiles.filter((file) => file.endsWith(".tsx"));

const safeShopVars = [
  "shop",
  "selectedShop",
  "activeShop",
  "currentShop",
  "focusedShop",
  "nextShop",
  "resolvedShop",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of tsxFiles) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;

  for (const variable of safeShopVars) {
    const v = escapeRegex(variable);

    const exactName = new RegExp(
      `\\{\\s*${v}\\.name\\s*\\}`,
      "g",
    );

    next = next.replace(
      exactName,
      `<span className={${variable}.slug === "zulf" ? "shop-name--zulfia" : undefined}>{${variable}.slug === "zulf" ? "Zulfia" : ${variable}.name}</span>`,
    );

    const upperName = new RegExp(
      `\\{\\s*${v}\\.name\\.toUpperCase\\(\\)\\s*\\}`,
      "g",
    );

    next = next.replace(
      upperName,
      `<span className={${variable}.slug === "zulf" ? "shop-name--zulfia" : undefined}>{${variable}.slug === "zulf" ? "Zulfia" : ${variable}.name.toUpperCase()}</span>`,
    );

    const optionalName = new RegExp(
      `\\{\\s*${v}\\?\\.name\\s*\\}`,
      "g",
    );

    next = next.replace(
      optionalName,
      `<span className={${variable}?.slug === "zulf" ? "shop-name--zulfia" : undefined}>{${variable}?.slug === "zulf" ? "Zulfia" : ${variable}?.name}</span>`,
    );
  }

  // ShopSwitcher often maps shops as "item".
  if (path.basename(file) === "ShopSwitcher.tsx") {
    next = next
      .replace(
        /\{\s*item\.name\s*\}/g,
        `<span className={item.slug === "zulf" ? "shop-name--zulfia" : undefined}>{item.slug === "zulf" ? "Zulfia" : item.name}</span>`,
      )
      .replace(
        /\{\s*item\.name\.toUpperCase\(\)\s*\}/g,
        `<span className={item.slug === "zulf" ? "shop-name--zulfia" : undefined}>{item.slug === "zulf" ? "Zulfia" : item.name.toUpperCase()}</span>`,
      );
  }

  if (next !== text) {
    backup(file);
    fs.writeFileSync(file, next, "utf8");
    changed.add(path.relative(root, file));
  }
}

// 3) Add the Zulfia handwritten brand style.
// Prefer ShopSwitcher.css so the rule stays close to the component.
// Fall back to index.css if the component has no dedicated stylesheet.
const switcherCss = sourceFiles.find(
  (file) => path.basename(file) === "ShopSwitcher.css",
);
const indexCss = path.join(frontendSrc, "index.css");
const cssTarget = switcherCss ?? indexCss;

if (!fs.existsSync(cssTarget)) {
  console.error("ERROR: no ShopSwitcher.css or frontend/src/index.css found.");
  process.exit(1);
}

let css = fs.readFileSync(cssTarget, "utf8");

const marker = "/* ZULFIA BRAND */";

if (!css.includes(marker)) {
  const block = `

/* ZULFIA BRAND */
.shop-name--zulfia {
  display: inline-block;
  font-family:
    "Snell Roundhand",
    "Segoe Script",
    "Brush Script MT",
    "URW Chancery L",
    cursive;
  font-size: 1.38em;
  font-weight: 400;
  font-style: normal;
  line-height: 0.9;
  letter-spacing: 0.01em;
  text-transform: none !important;
  white-space: nowrap;
  transform: translateY(0.03em);
  transform-origin: center;
}

@media (max-width: 700px) {
  .shop-name--zulfia {
    font-size: 1.32em;
  }
}
`;

  backup(cssTarget);
  fs.writeFileSync(cssTarget, css.trimEnd() + block, "utf8");
  changed.add(path.relative(root, cssTarget));
}

console.log("");
console.log("Zulfia patch applied.");
console.log("");
console.log("Changed files:");
for (const file of [...changed].sort()) {
  console.log(`  - ${file}`);
}
console.log("");
console.log('Slug stays "zulf" so old links and routes do not break.');
console.log("Run: cd frontend && npm run build");
