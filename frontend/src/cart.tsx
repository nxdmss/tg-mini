import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import type { CartItem } from "./types";

const STORAGE_KEY = "tgmini.cart.v1";

type CartContextValue = {
  items: CartItem[];

  count: number;

  total: number;

  add: (item: CartItem) => void;

  setQuantity: (
    productId: string,
    size: string,
    quantity: number,
  ) => void;

  remove: (
    productId: string,
    size: string,
  ) => void;

  clear: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(
    null,
  );

function normalizeStoredItem(
  item: Partial<CartItem>,
): CartItem | null {
  if (
    !item.productId ||
    !item.name ||
    !item.size ||
    typeof item.price !== "number"
  ) {
    return null;
  }

  const quantity =
    typeof item.quantity === "number"
      ? Math.max(
          1,
          Math.floor(item.quantity),
        )
      : 1;

  const maxStock =
    typeof item.maxStock === "number"
      ? Math.max(
          0,
          Math.floor(item.maxStock),
        )
      : 999;

  return {
    productId: item.productId,

    name: item.name,

    price: item.price,

    image: item.image,

    size: item.size,

    quantity: Math.min(
      quantity,
      Math.max(maxStock, 1),
    ),

    maxStock,
  };
}

function load(): CartItem[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) =>
        normalizeStoredItem(item),
      )
      .filter(
        (
          item,
        ): item is CartItem =>
          item !== null,
      );
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] =
    useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // storage unavailable
    }
  }, [items]);

  const add = useCallback(
    (item: CartItem) => {
      if (
        item.maxStock <= 0 ||
        item.quantity <= 0
      ) {
        return;
      }

      setItems((prev) => {
        const idx =
          prev.findIndex(
            (current) =>
              current.productId ===
                item.productId &&
              current.size ===
                item.size,
          );

        if (idx >= 0) {
          const next = [
            ...prev,
          ];

          const current =
            next[idx];

          const maxStock =
            Math.max(
              0,
              item.maxStock,
            );

          const nextQuantity =
            Math.min(
              current.quantity +
                item.quantity,
              maxStock,
            );

          next[idx] = {
            ...current,

            ...item,

            quantity:
              nextQuantity,

            maxStock,
          };

          return next;
        }

        return [
          ...prev,
          {
            ...item,

            quantity:
              Math.min(
                item.quantity,
                item.maxStock,
              ),
          },
        ];
      });
    },
    [],
  );

  const setQuantity =
    useCallback(
      (
        productId: string,
        size: string,
        quantity: number,
      ) => {
        setItems((prev) =>
          prev
            .map((item) => {
              if (
                item.productId !==
                  productId ||
                item.size !==
                  size
              ) {
                return item;
              }

              return {
                ...item,

                quantity:
                  Math.min(
                    quantity,
                    item.maxStock,
                  ),
              };
            })
            .filter(
              (item) =>
                item.quantity >
                0,
            ),
        );
      },
      [],
    );

  const remove =
    useCallback(
      (
        productId: string,
        size: string,
      ) => {
        setItems((prev) =>
          prev.filter(
            (item) =>
              !(
                item.productId ===
                  productId &&
                item.size === size
              ),
          ),
        );
      },
      [],
    );

  const clear =
    useCallback(() => {
      setItems([]);
    }, []);

  const value =
    useMemo<CartContextValue>(
      () => {
        const count =
          items.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              item.quantity,
            0,
          );

        const total =
          items.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              item.quantity *
                item.price,
            0,
          );

        return {
          items,
          count,
          total,
          add,
          setQuantity,
          remove,
          clear,
        };
      },
      [
        items,
        add,
        setQuantity,
        remove,
        clear,
      ],
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx =
    useContext(
      CartContext,
    );

  if (!ctx) {
    throw new Error(
      "useCart must be used within CartProvider",
    );
  }

  return ctx;
}