import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard.jsx';
import './CatalogSection.css';

export default function CatalogSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/productos');
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Duplicamos el array para mantener el efecto del track infinito en CSS
          setProducts([...data, ...data]);
        }
      } catch (error) {
        console.error("Error cargando el carrusel de catálogo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>Cargando catálogo...</div>
        ) : (
          <div className="catalog-carousel-track">
            {products.map((item, i) => (
              <div key={`${item.id}-${i}`} className="catalog-carousel-item">
                <ProductCard item={item} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}