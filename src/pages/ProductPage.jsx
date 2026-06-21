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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <Link to="/catalogo">Catálogo</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <span>{product.title}</span>
      </nav>

      <div className="product-page-layout">
        {/* Galería de Imágenes */}
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
                  <img src={photo} alt={`Vista ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del Producto */}
        <div className="product-info">
          <div className="product-header">
            <span className="product-category">{product.category}</span>
            <h1>{product.title}</h1>
          </div>

          {/* Tarjeta de Precio Centrada */}
          <div className="product-pricing-card">
            <div className="product-pricing">
              {product.priceOriginal && (
                <span className="product-price-old">{product.priceOriginal}</span>
              )}
              <span className="product-price">{product.price}</span>
            </div>
            <span className="product-tax-info">Precio final. Opciones de pago por transferencia.</span>
          </div>

          <p className="product-description">{product.description}</p>

          {product.details?.length > 0 && (
            <div className="product-details-wrap">
              <h4>Características</h4>
              <ul className="product-details">
                {product.details.map((detail) => (
                  <li key={detail}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="product-actions">
            <a
              href={`https://wa.me/${WPP}?text=${wppMessage}`}
              target="_blank"
              rel="noreferrer"
              className="product-btn-primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0C5.372 0 0 5.373 0 11.997c0 2.128.553 4.19 1.603 6.012L.15 24l6.14-1.613a11.916 11.916 0 005.706 1.455c6.623 0 11.996-5.373 11.996-11.997C23.992 5.373 18.62 0 11.996 0zm0 21.848a9.92 9.92 0 01-5.06-1.383l-.36-.214-3.76.988.997-3.666-.235-.373A9.917 9.917 0 011.998 12c0-5.516 4.484-10 10-10s10 4.484 10 10-4.484 10-10 10zm5.498-7.513c-.302-.15-1.785-.882-2.062-.983-.277-.101-.48-.152-.68.15-.202.302-.782.983-.958 1.185-.177.201-.354.226-.656.076-1.127-.563-2.185-1.3-2.998-2.263-.228-.27-.024-.418.127-.568.136-.135.302-.353.453-.529.151-.177.201-.303.302-.505.1-.202.05-.38-.025-.53-.076-.152-.68-1.644-.932-2.25-.246-.593-.497-.512-.68-.52-.176-.008-.38-.01-.58-.01-.201 0-.528.076-.804.378-.277.302-1.056 1.033-1.056 2.522 0 1.488 1.08 2.927 1.231 3.128.151.202 2.134 3.26 5.166 4.568 1.956.842 2.65.748 3.167.625.68-.163 1.785-.73 2.037-1.436.252-.705.252-1.31.177-1.437-.076-.126-.277-.202-.58-.353z"/></svg>
              Consultar por WhatsApp
            </a>
            
            {/* Botón secundario mejorado */}
            <Link to="/#personalizar" className="product-btn-secondary">
              
              Personalizar prenda similar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}