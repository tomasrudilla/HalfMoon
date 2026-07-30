import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  getSiteOrigin,
} from './siteConfig.js';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Actualiza title, description, canonical, Open Graph y Twitter Card por ruta.
 * Googlebot ejecuta JS; Seobility y crawlers sin JS leen el baseline de index.html.
 */
export default function SeoHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const jsonLdSerialized = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = absoluteUrl(path);
    const origin = getSiteOrigin();
    const imageUrl = image?.startsWith('http') ? image : absoluteUrl(image || '/favicon.svg');

    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertLink('canonical', url);

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', SITE_LOCALE);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', imageUrl);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    if (origin) {
      upsertMeta('property', 'og:image:alt', SITE_NAME);
    }

    if (jsonLdSerialized) {
      upsertJsonLd('seo-jsonld-page', JSON.parse(jsonLdSerialized));
    } else {
      document.getElementById('seo-jsonld-page')?.remove();
    }

    return () => {
      document.getElementById('seo-jsonld-page')?.remove();
    };
  }, [title, description, path, image, type, noindex, jsonLdSerialized]);

  return null;
}
