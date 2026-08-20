export type ProductImage = {
  id: string;
  url: string;
};

export type ProductSize = {
  id: string;
  size: string;
  stock: number;
};

export type NamedRef = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  inStock: boolean;

  brand: NamedRef;
  category: NamedRef;

  images: ProductImage[];
  sizes: ProductSize[];
};

export type Category = NamedRef & {
  _count?: {
    products: number;
  };
};

export type Brand = NamedRef & {
  _count?: {
    products: number;
  };
};

export type OrderItem = {
  id: string;
  quantity: number;
  size: string;
  price: number;
  product: Product;
};

export type Order = {
  id: string;

  status:
    | "PENDING"
    | "PAID"
    | "CANCELLED"
    | "SHIPPED"
    | "DONE";

  customerName?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  address?: string | null;
  comment?: string | null;

  items: OrderItem[];

  createdAt?: string;
};

export type OrderStatus = Order["status"];

export type AdminOrder = Order & {
  user: {
    id?: string;
    telegramId?: string | null;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  };
};

export type AuthUser = {
  id?: string;

  telegramId?: string | null;
  email?: string | null;

  firstName?: string;
  lastName?: string;
  username?: string;

  name?: string | null;
  phone?: string | null;

  role:
    | "USER"
    | "ADMIN"
    | "MANAGER";
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  quantity: number;

  maxStock: number;
};

export type ProductsQuery = {
  category?: string;
  brand?: string;
  search?: string;

  sort?:
    | "name_asc"
    | "newest"
    | "price_asc"
    | "price_desc";

  inStock?: boolean;
};