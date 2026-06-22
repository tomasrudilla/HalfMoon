import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ item, compact = false }) {
  // Evaluamos si el producto tiene un precio promocional cargado en la BD
  const hasOffer = item.promo_price && item.promo_price !== item.price;

  return (
    <Link to={`/catalogo/${item.id}`} className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <div className="product-card-image">
        {hasOffer && <span className="product-card-offer">Oferta</span>}
        
        {/* Cambiamos item.image por item.image_1 (nombre de tu columna en SQL) */}
        <img src={item.image_1} alt={item.title} loading="lazy" />
        
        <span className="product-card-eye" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
      </div>
      
      <div className="product-card-body">
        <span className="product-card-category">{item.category}</span>
        
        {/* Cambiamos item.name por item.title */}
        <h3>{item.title}</h3>
        
        <div className="product-card-prices">
          {/* Lógica para mostrar precio viejo tachado si hay promo_price */}
          {hasOffer ? (
            <>
              <span className="product-card-price-old">{item.price}</span>
              <span className="product-card-price">{item.promo_price}</span>
            </>
          ) : (
            <span className="product-card-price">{item.price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}