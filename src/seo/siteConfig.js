/** Config SEO / GEO de HalfMoon. */

/** Dominio canónico de producción (recién comprado). */
export const SITE_URL = 'https://halfmoon.com.ar';

/** Deploy actual en Vercel (redirige al canónico cuando el dominio esté conectado). */
export const LEGACY_SITE_URL = 'https://halfmoon-iota.vercel.app';

export const SITE_NAME = 'HalfMoon Indumentaria';
export const SITE_TAGLINE = 'ES LA PERCHA, NO LA PILCHA';
export const SITE_LOCALE = 'es_AR';
export const SITE_LANG = 'es-AR';

export const DEFAULT_TITLE =
  'HalfMoon Indumentaria | Remeras, buzos y estampados en Córdoba';

export const DEFAULT_DESCRIPTION =
  'Indumentaria y estampados personalizados en Córdoba, Argentina. Minorista, mayorista y diseños a medida con personalizador online. Envíos a todo el país.';

export const DEFAULT_KEYWORDS = [
  'HalfMoon Indumentaria',
  'indumentaria Córdoba',
  'remeras personalizadas Córdoba',
  'estampados personalizados',
  'ropa mayorista Córdoba',
  'diseño de prendas online',
  'buzos personalizados',
].join(', ');

/** Logo / imagen social (CloudFront). Ideal reemplazar por OG 1200×630 cuando exista. */
export const OG_IMAGE =
  'https://d22fxaf9t8d39k.cloudfront.net/5009daf20579eb1b525efcc155225c5570c37dc556d994000e00fceb70568b86273842.jpg';

export const SOCIAL = {
  instagram: 'https://instagram.com/halfmoon.indumentaria',
  email: 'halfmooncba@gmail.com',
};

export const BUSINESS = {
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  areaServed: 'AR',
  addressLocality: 'Córdoba',
  addressCountry: 'AR',
  sameAs: [SOCIAL.instagram],
};

/** Origen absoluto: env → dominio canónico. */
export function getSiteOrigin() {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return SITE_URL;
}

export function absoluteUrl(path = '/') {
  const origin = getSiteOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized === '/' ? '/' : normalized}`;
}

export function titleFor(pageTitle) {
  if (!pageTitle) return DEFAULT_TITLE;
  return `${pageTitle} | ${SITE_NAME}`;
}
