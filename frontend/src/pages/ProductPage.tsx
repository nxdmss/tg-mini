import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (!product) return <p>loading...</p>;

  return (
    <div style={{ padding: 12 }}>
      <img src={product.images?.[0]?.url} style={{ width: "100%" }} />

      <h2>{product.name}</h2>
      <p>{product.price} ₽</p>

      <button
        style={{
          width: "100%",
          padding: 14,
          background: "green",
          color: "white",
          borderRadius: 10
        }}
      >
        В корзину
      </button>
    </div>
  );
}