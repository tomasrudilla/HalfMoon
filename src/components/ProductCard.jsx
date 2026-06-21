import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ item, compact = false }) {
  return (
    <Link to={`/catalogo/${item.id}`} className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <div className="product-card-image">
        {item.offer && <span className="product-card-offer">{item.offer}</span>}
        <img src={item.image} alt={item.title} loading="lazy" />
        <span className="product-card-eye" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
      </div>
      <div className="product-card-body">
        <span className="product-card-category">{item.category}</span>
        <h3>{item.title}</h3>
        <div className="product-card-prices">
          {item.priceOriginal && <span className="product-card-price-old">{item.priceOriginal}</span>}
          <span className="product-card-price">{item.price}</span>
        </div>
      </div>
    </Link>
  );
}
