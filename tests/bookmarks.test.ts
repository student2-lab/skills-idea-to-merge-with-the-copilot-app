import { describe, expect, it } from 'vitest';
import {
  formatBookmark,
  generateSlug,
  normalizeUrl,
  parseStoredBookmarks,
  serializeBookmarks,
  type Bookmark,
} from '../src/lib/bookmarks';

describe('normalizeUrl', () => {
  it('normalises a URL without a scheme the same as one with https://', () => {
    expect(normalizeUrl('www.example.com')).toBe(normalizeUrl('https://www.example.com'));
  });

  it('adds https:// when no scheme is present', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('preserves an explicit http:// scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('trims whitespace before normalising', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });

  it('returns null for empty or unparsable input', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
    expect(normalizeUrl('not a url at all!!')).toBeNull();
  });
});

describe('generateSlug', () => {
  it('always starts with the mona- prefix', () => {
    expect(generateSlug()).toMatch(/^mona-/);
  });

  it('produces a deterministic base62 slug from a fixed random source', () => {
    const slug = generateSlug(4, () => 0);
    expect(slug).toBe('mona-AAAA');
  });

  it('respects a custom length', () => {
    const slug = generateSlug(6, () => 0.999999);
    expect(slug).toBe('mona-999999');
  });
});

describe('formatBookmark', () => {
  it('formats using the exact " :: " separator', () => {
    const bookmark: Bookmark = { url: 'https://www.example.com', slug: 'mona-7fk2' };
    expect(formatBookmark(bookmark)).toBe('https://www.example.com :: mona-7fk2');
  });
});

describe('parseStoredBookmarks', () => {
  it('recovers an empty array from null/undefined/empty-string values', () => {
    expect(parseStoredBookmarks(null)).toEqual([]);
    expect(parseStoredBookmarks(undefined)).toEqual([]);
    expect(parseStoredBookmarks('')).toEqual([]);
  });

  it('recovers an empty array from corrupted (invalid JSON) values', () => {
    expect(parseStoredBookmarks('{not valid json')).toEqual([]);
  });

  it('recovers an empty array from a legacy/non-array shape', () => {
    expect(parseStoredBookmarks(JSON.stringify({ url: 'https://example.com', slug: 'mona-abcd' }))).toEqual([]);
    expect(parseStoredBookmarks(JSON.stringify('just a string'))).toEqual([]);
    expect(parseStoredBookmarks(JSON.stringify(42))).toEqual([]);
  });

  it('drops malformed entries but keeps valid ones from a mixed array', () => {
    const raw = JSON.stringify([
      { url: 'https://example.com', slug: 'mona-abcd' },
      { url: 'https://missing-slug.com' },
      { slug: 'mona-noslug' },
      null,
      'not an object',
      42,
      { url: 123, slug: 'mona-bad' },
      { url: 'https://good.com', slug: 'mona-good' },
    ]);
    expect(parseStoredBookmarks(raw)).toEqual([
      { url: 'https://example.com', slug: 'mona-abcd' },
      { url: 'https://good.com', slug: 'mona-good' },
    ]);
  });

  it('round-trips through serializeBookmarks', () => {
    const bookmarks: Bookmark[] = [{ url: 'https://example.com', slug: 'mona-abcd' }];
    expect(parseStoredBookmarks(serializeBookmarks(bookmarks))).toEqual(bookmarks);
  });
});
