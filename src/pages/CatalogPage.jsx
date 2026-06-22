import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import './CatalogPage.css';

export default function CatalogPage() {
  const [filter, setFilter] = useState('Todos');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/productos'); 
        const data = await response.json();
        
        // Prevención contra el pantallazo blanco: Aseguramos que data sea un array
        if (Array.isArray(data)) {
          setProducts(data);
          const uniqueCategories = ['Todos', ...new Set(data.map((p) => p.category))];
          setCategories(uniqueCategories);
        } else {
          console.error("El backend no devolvió un array:", data);
          setProducts([]); 
        }
      } catch (error) {
        console.error("Error trayendo los productos de la BD:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const items =
    filter === 'Todos'
      ? products
      : products.filter((p) => p.category === filter);

  if (loading) {
    return (
      <main className="catalog-page">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>Cargando catálogo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog-page">
      <header className="catalog-page-hero">
        <p className="catalog-page-eyebrow">Tienda HalfMoon</p>
        <h1>Catálogo completo</h1>
        <p>Todos nuestros productos con precios actualizados. Tocá cualquier prenda para ver el detalle.</p>
      </header>

      <div className="catalog-page-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`catalog-filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="catalog-page-grid">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}