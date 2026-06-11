export type ProductImage = { id: string; url: string };
export type ProductSize = { id: string; size: string };
export type NamedRef = { id: string; name: string };

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

export type Category = NamedRef & { _count?: { products: number } };
export type Brand = NamedRef & { _count?: { products: number } };

export type Order = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "SHIPPED" | "DONE";
  createdAt?: string;
};

export type OrderStatus = Order["status"];

export type AdminOrder = Order & {
  customerName?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  address?: string | null;
  comment?: string | null;
  user: {
    telegramId: string;
    name?: string | null;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    size: string;
    price: number;
    product: Product;
  }>;
};

export type AuthUser = {
  telegramId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: "USER" | "ADMIN" | "MANAGER";
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  quantity: number;
};

export type ProductsQuery = {
  category?: string;
  brand?: string;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  inStock?: boolean;
};
