import type { DreamProjectLink } from './dreamData';

export function isSafeProjectHref(href: string) {
  const value = href.trim();
  if ((value.startsWith('/') && !value.startsWith('//')) || value.startsWith('#')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getPrimaryProjectLinks(links: readonly DreamProjectLink[]) {
  return links.filter(
    (link) => (link.kind === 'live' || link.kind === 'github') && isSafeProjectHref(link.href),
  );
}

export function getSupportingProjectLinks(links: readonly DreamProjectLink[]) {
  return links.filter((link) => link.kind === 'contact' && isSafeProjectHref(link.href));
}
