import { GALLERY_IMAGES } from '../data/storeProducts.js';
import './StyleMarquee.css';

export default function StyleMarquee() {
  const track = [...GALLERY_IMAGES, ...GALLERY_IMAGES];

  return (
    <section className="style-marquee-section">
      <h2 className="section-title section-title-dark">ESTILO HALFMOON</h2>
      <p className="style-marquee-sub">Diseños reales de nuestra comunidad</p>

      <div className="style-marquee-wrap">
        <div className="style-marquee-track">
          {track.map((src, i) => (
            <div key={`${src}-${i}`} className="style-marquee-item">
              <img src={src} alt={`Estilo HalfMoon ${(i % GALLERY_IMAGES.length) + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
