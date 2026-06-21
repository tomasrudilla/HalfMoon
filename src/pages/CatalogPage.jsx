import { useState } from 'react';
import { STORE_PRODUCTS } from '../data/storeProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import './CatalogPage.css';

const CATEGORIES = ['Todos', ...new Set(STORE_PRODUCTS.map((p) => p.category))];

export default function CatalogPage() {
  const [filter, setFilter] = useState('Todos');

  const items =
    filter === 'Todos'
      ? STORE_PRODUCTS
      : STORE_PRODUCTS.filter((p) => p.category === filter);

  return (
    <main className="catalog-page">
      <header className="catalog-page-hero">
        <p className="catalog-page-eyebrow">Tienda HalfMoon</p>
        <h1>Catálogo completo</h1>
        <p>Todos nuestros productos con precios actualizados. Tocá cualquier prenda para ver el detalle.</p>
      </header>

      <div className="catalog-page-filters">
        {CATEGORIES.map((cat) => (
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
