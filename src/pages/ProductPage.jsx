import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { getProductById, getProductPhotos } from '../data/storeProducts.js';
import './ProductPage.css';

const WPP = '5493516668259';

export default function ProductPage() {
  const { id } = useParams();
  const product = getProductById(id);
  const photos = product ? getProductPhotos(product) : [];
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    setActivePhoto(0);
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) return <Navigate to="/catalogo" replace />;

  const wppMessage = encodeURIComponent(
    `Hola HalfMoon! Me interesa: ${product.title} (${product.price})`
  );

  return (
    <main className="product-page">
      <nav className="product-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/catalogo">Catálogo</Link>
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      <div className="product-page-layout">
        <div className="product-gallery">
          <div className="product-gallery-main">
            {product.offer && <span className="product-offer-badge">{product.offer}</span>}
            <img src={photos[activePhoto]} alt={product.title} />
          </div>
          {photos.length > 1 && (
            <div className="product-gallery-thumbs">
              {photos.map((photo, i) => (
                <button
                  key={photo}
                  type="button"
                  className={`product-thumb ${i === activePhoto ? 'active' : ''}`}
                  onClick={() => setActivePhoto(i)}
                >
                  <img src={photo} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.title}</h1>

          <div className="product-pricing">
            {product.priceOriginal && (
              <span className="product-price-old">{product.priceOriginal}</span>
            )}
            <span className="product-price">{product.price}</span>
          </div>

          <p className="product-description">{product.description}</p>

          {product.details?.length > 0 && (
            <ul className="product-details">
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}

          <div className="product-actions">
            <a
              href={`https://wa.me/${WPP}?text=${wppMessage}`}
              target="_blank"
              rel="noreferrer"
              className="product-btn-primary"
            >
              Consultar por WhatsApp
            </a>
            <Link to="/#personalizar" className="product-btn-secondary">
              Personalizar prenda similar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
