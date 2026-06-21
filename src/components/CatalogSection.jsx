import { Link } from 'react-router-dom';
import { STORE_PRODUCTS } from '../data/storeProducts.js';
import ProductCard from './ProductCard.jsx';
import './CatalogSection.css';

export default function CatalogSection() {
  const track = [...STORE_PRODUCTS, ...STORE_PRODUCTS];

  return (
    <section id="servicios" className="catalog-section">
      <div className="catalog-section-header">
        <div>
          <h2 className="section-title section-title-dark">NUESTRO CATÁLOGO</h2>
          <p className="catalog-subtitle">Deslizá y descubrí toda la colección HalfMoon</p>
        </div>
        <Link to="/catalogo" className="catalog-see-all">
          Ver catálogo completo →
        </Link>
      </div>

      <div className="catalog-carousel-wrap">
        <div className="catalog-carousel-track">
          {track.map((item, i) => (
            <div key={`${item.id}-${i}`} className="catalog-carousel-item">
              <ProductCard item={item} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
