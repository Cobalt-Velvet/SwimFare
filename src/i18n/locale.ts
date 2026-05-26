import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Locale, ThemePref } from './strings';
import type { Direction } from '../lib/routes';

const SUPPORTED: readonly Locale[] = ['ja', 'ko'] as const;

function isLocale(v: unknown): v is Locale {
  return v === 'ja' || v === 'ko';
}

function parseAcceptLanguage(header: string): Locale {
  // 例: "ko-KR,ko;q=0.9,en;q=0.8" → ko
  const tags = header
    .split(',')
    .map((s) => s.split(';')[0].trim().toLowerCase())
    .filter(Boolean);
  for (const tag of tags) {
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
  }
  return 'ja';
}

export function detectLocale(c: Context): Locale {
  const cookie = getCookie(c, 'locale');
  if (isLocale(cookie)) return cookie;
  const al = c.req.header('accept-language') ?? '';
  return parseAcceptLanguage(al);
}

export function detectTheme(c: Context): ThemePref {
  const cookie = getCookie(c, 'theme');
  if (cookie === 'light' || cookie === 'dark') return cookie;
  return null;
}

export function detectDirection(c: Context): Direction {
  const cookie = getCookie(c, 'direction');
  if (cookie === 'kr-to-jp' || cookie === 'jp-to-kr') return cookie;
  return 'kr-to-jp';
}

export { SUPPORTED };
