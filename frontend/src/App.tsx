import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: { url: string }[];
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          'https://unimmaculately-unogled-savanna.ngrok-free.dev/products',
          {
            cache: 'no-store',
          }
        );

        const data = await res.json();

        console.log('RAW API RESPONSE:', data);

        const normalized = Array.isArray(data)
          ? data
          : data?.products || [];

        setProducts(normalized);
      } catch (e) {
        console.error('FETCH ERROR:', e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <h2 style={{ padding: 20 }}>Загрузка...</h2>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🛍 Mini Shop</h1>

      {products.length === 0 && <p>Нет товаров</p>}

      {products.map((p) => (
        <div key={p.id} style={{ marginBottom: 20 }}>
          <img
            src={p.images?.[0]?.url || 'https://picsum.photos/200'}
            width={120}
            alt={p.name}
          />
          <h3>{p.name}</h3>
          <p>{p.price} ₽</p>
          {p.description && <p>{p.description}</p>}
        </div>
      ))}
    </div>
  );
}