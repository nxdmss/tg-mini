export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "SHIPPED"
  | "DONE";

export type ProductImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export type OrderProduct = {
  id: string;
  name: string;
  images: ProductImage[];
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  size: string;
  price: number;
  product: OrderProduct;
};

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  deliveryMethod: string | null;
  address: string | null;
  comment: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
  };
};
