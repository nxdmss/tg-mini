import { useEffect, useState } from "react";
import { api } from "./api";

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error("ERROR LOADING PRODUCTS:", err);
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Mini App</h1>

      {products.length === 0 ? (
        <p>нет товаров</p>
      ) : (
        products.map((p) => (
          <div key={p.id} style={{ marginBottom: 10 }}>
            <h3>{p.name}</h3>
            <p>{p.price} ₽</p>
          </div>
        ))
      )}
    </div>
  );
}