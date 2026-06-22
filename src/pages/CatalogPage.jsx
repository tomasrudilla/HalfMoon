import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import './CatalogPage.css';

export default function CatalogPage() {
  const [filter, setFilter] = useState('Todos');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [loading, setLoading] = useState(true);

  // Hook para cargar los datos de la base de datos cuando el componente se monta
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ACÁ REEMPLAZÁS LA URL POR EL ENDPOINT DE TU API
        const response = await fetch('/api/productos'); 
        const data = await response.json();
        
        setProducts(data);
        
        // Armamos las categorías dinámicamente basadas en lo que vino de la BD
        const uniqueCategories = ['Todos', ...new Set(data.map((p) => p.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error trayendo los productos de la BD:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtramos sobre el estado 'products' que vino de la base de datos
  const items =
    filter === 'Todos'
      ? products
      : products.filter((p) => p.category === filter);

  // Mientras esperamos que el backend responda, mostramos un loading
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