// Pure helpers for the bookmarks feature.
//
// Nothing in this file touches the DOM, window, or localStorage — it is safe
// to import from both the client-side <script> in Bookmarks.astro and from
// unit tests that run under Node (no browser required).

export const STORAGE_KEY = 'mona-bookmarks';

export interface Bookmark {
  url: string;
  slug: string;
}

const BASE62_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Normalise a user-typed URL so that "example.com" and "https://example.com"
 * (and trailing-slash variants) all resolve to the same saved value.
 * Returns null when the input can't be parsed as a URL at all.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    // Drop a trailing slash on bare-path URLs so example.com/ === example.com.
    let href = parsed.href;
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      href = href.replace(/\/$/, '');
    }
    return href;
  } catch {
    return null;
  }
}

/**
 * Generate a short base62 slug with a "mona-" prefix, e.g. "mona-7fk2".
 * Accepts an optional random source (0..1) so it can be tested deterministically.
 */
export function generateSlug(length = 4, random: () => number = Math.random): string {
  let slug = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(random() * BASE62_ALPHABET.length);
    slug += BASE62_ALPHABET[index];
  }
  return `mona-${slug}`;
}

/** Render a bookmark using the exact " :: " separator required by the UI. */
export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}

function isValidBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.url === 'string' && candidate.url.length > 0
    && typeof candidate.slug === 'string' && candidate.slug.length > 0;
}

/**
 * Parse a raw value read from storage into a clean list of bookmarks.
 * Never throws: empty, corrupted, legacy, or non-array values all recover
 * to an empty (or filtered) array instead of propagating an error.
 */
export function parseStoredBookmarks(raw: string | null | undefined): Bookmark[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isValidBookmark);
}

/** Serialise bookmarks for storage. */
export function serializeBookmarks(bookmarks: Bookmark[]): string {
  return JSON.stringify(bookmarks);
}
