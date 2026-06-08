import type { Category, Product } from "./types";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

export const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Худи" },
  { id: "c2", name: "Футболки" },
  { id: "c3", name: "Куртки" },
  { id: "c4", name: "Брюки" },
  { id: "c5", name: "Кроссовки" },
  { id: "c6", name: "Аксессуары" },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Oversize Hoodie",
    price: 4990,
    description:
      "Премиальное худи свободного кроя из плотного хлопка с начёсом. Мягкая внутренняя отделка и объёмный капюшон.",
    inStock: true,
    brand: { id: "b1", name: "Nike" },
    category: { id: "c1", name: "Худи" },
    images: [
      { id: "i1", url: img("1576566588028-4147f3842f27") },
      { id: "i2", url: img("1620799140408-edc6dcb6d633") },
    ],
    sizes: [
      { id: "s1", size: "S" },
      { id: "s2", size: "M" },
      { id: "s3", size: "L" },
      { id: "s4", size: "XL" },
    ],
  },
  {
    id: "p2",
    name: "Essential Cotton Hoodie",
    price: 3490,
    description: "Базовое худи на каждый день. Мягкий хлопок, аккуратные швы.",
    inStock: true,
    brand: { id: "b2", name: "Uniqlo" },
    category: { id: "c1", name: "Худи" },
    images: [{ id: "i3", url: img("1620799140408-edc6dcb6d633") }],
    sizes: [
      { id: "s5", size: "S" },
      { id: "s6", size: "M" },
      { id: "s7", size: "L" },
    ],
  },
  {
    id: "p3",
    name: "Classic White Tee",
    price: 1490,
    description: "Чистая белая футболка из 100% хлопка. Минимализм в каждой детали.",
    inStock: true,
    brand: { id: "b2", name: "Uniqlo" },
    category: { id: "c2", name: "Футболки" },
    images: [{ id: "i4", url: img("1521572163474-6864f9cf17ab") }],
    sizes: [
      { id: "s8", size: "S" },
      { id: "s9", size: "M" },
      { id: "s10", size: "L" },
      { id: "s11", size: "XL" },
    ],
  },
  {
    id: "p4",
    name: "Heavyweight Logo Tee",
    price: 2990,
    description: "Плотная футболка с фирменным принтом. Держит форму после стирок.",
    inStock: true,
    brand: { id: "b3", name: "Stussy" },
    category: { id: "c2", name: "Футболки" },
    images: [{ id: "i5", url: img("1594633312681-425c7b97ccd1") }],
    sizes: [
      { id: "s12", size: "S" },
      { id: "s13", size: "M" },
      { id: "s14", size: "L" },
    ],
  },
  {
    id: "p5",
    name: "Mountain Down Jacket",
    price: 18990,
    description: "Тёплый пуховик для города и гор. Водоотталкивающее покрытие.",
    inStock: true,
    brand: { id: "b4", name: "The North Face" },
    category: { id: "c3", name: "Куртки" },
    images: [{ id: "i6", url: img("1551028719-00167b16eac5") }],
    sizes: [
      { id: "s15", size: "M" },
      { id: "s16", size: "L" },
      { id: "s17", size: "XL" },
    ],
  },
  {
    id: "p6",
    name: "Detroit Work Jacket",
    price: 14990,
    description: "Культовая рабочая куртка из плотного канваса с подкладкой.",
    inStock: false,
    brand: { id: "b5", name: "Carhartt" },
    category: { id: "c3", name: "Куртки" },
    images: [{ id: "i7", url: img("1503341504253-dff4815485f1") }],
    sizes: [
      { id: "s18", size: "M" },
      { id: "s19", size: "L" },
    ],
  },
  {
    id: "p7",
    name: "Slim Fit Jeans",
    price: 4490,
    description: "Зауженные джинсы из эластичного денима. Идеальная посадка.",
    inStock: true,
    brand: { id: "b2", name: "Uniqlo" },
    category: { id: "c4", name: "Брюки" },
    images: [{ id: "i8", url: img("1542272604-787c3835535d") }],
    sizes: [
      { id: "s20", size: "S" },
      { id: "s21", size: "M" },
      { id: "s22", size: "L" },
    ],
  },
  {
    id: "p8",
    name: "Air Runner Sneakers",
    price: 12990,
    description: "Лёгкие кроссовки с амортизацией для города и пробежек.",
    inStock: true,
    brand: { id: "b1", name: "Nike" },
    category: { id: "c5", name: "Кроссовки" },
    images: [{ id: "i9", url: img("1556821840-3a63f95609a7") }],
    sizes: [
      { id: "s23", size: "40" },
      { id: "s24", size: "41" },
      { id: "s25", size: "42" },
      { id: "s26", size: "43" },
    ],
  },
  {
    id: "p9",
    name: "Ultra Boost Sneakers",
    price: 13990,
    description: "Энергичная подошва и дышащий верх. Комфорт на весь день.",
    inStock: true,
    brand: { id: "b6", name: "Adidas" },
    category: { id: "c5", name: "Кроссовки" },
    images: [{ id: "i10", url: img("1578587018452-892bacefd3f2") }],
    sizes: [
      { id: "s27", size: "41" },
      { id: "s28", size: "42" },
      { id: "s29", size: "43" },
      { id: "s30", size: "44" },
    ],
  },
  {
    id: "p10",
    name: "Knit Beanie",
    price: 1990,
    description: "Тёплая шапка крупной вязки. Универсальный аксессуар.",
    inStock: true,
    brand: { id: "b5", name: "Carhartt" },
    category: { id: "c6", name: "Аксессуары" },
    images: [{ id: "i11", url: img("1620012253295-c15cc3e65df4") }],
    sizes: [{ id: "s31", size: "OS" }],
  },
];

export function filterMockProducts(
  query: {
    category?: string;
    search?: string;
    sort?: "newest" | "price_asc" | "price_desc";
  } = {},
): Product[] {
  let list = [...MOCK_PRODUCTS];

  if (query.category) {
    list = list.filter((p) => p.category.name === query.category);
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q),
    );
  }

  switch (query.sort) {
    case "price_asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      list.sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }

  return list;
}
