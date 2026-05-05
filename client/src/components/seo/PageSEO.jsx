import { useEffect } from 'react';

const SITE_NAME = 'ChildBloom';
const SITE_URL = 'https://childbloom.in';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function PageSEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  structuredData,
}) {
  const fullTitle = title
    ? title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — AI Child Development App for Indian Parents`;

  const resolvedCanonical = canonical
    ? `${SITE_URL}${canonical}`
    : SITE_URL;

  useEffect(() => {
    document.title = fullTitle;

    if (description) setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setLink('canonical', resolvedCanonical);

    setMeta('og:title', fullTitle, 'property');
    if (description) setMeta('og:description', description, 'property');
    setMeta('og:type', ogType, 'property');
    setMeta('og:url', resolvedCanonical, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:site_name', SITE_NAME, 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    if (description) setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    if (structuredData) {
      let el = document.querySelector('script[type="application/ld+json"]#page-seo');
      if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = 'page-seo';
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, description, noindex, resolvedCanonical, ogType, ogImage, structuredData]);

  return null;
}
