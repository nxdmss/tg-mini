import { useEffect, useState } from "react";
import { api } from "../../api/api";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}