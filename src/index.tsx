import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { collectPrices } from './lib/collector';
import { getRoutePayload, getRouteHistory } from './lib/store';
import {
  KOREA_TO_JAPAN,
  JAPAN_TO_KOREA,
  isTrackedRoute,
  routeDirection,
  type Direction,
} from './lib/routes';
import { detectLocale, detectTheme, detectDirection } from './i18n/locale';
import type { Locale, ThemePref } from './i18n/strings';
import { Layout } from './views/layout';
import { Home } from './views/home';
import { RouteDetail } from './views/route';

export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  TRAVELPAYOUTS_TOKEN: string;
  ADSENSE_CLIENT_ID?: string;
  ADSENSE_SLOT_ID?: string;
};

export type Variables = {
  locale: Locale;
  theme: ThemePref;
  direction: Direction;
};

type AdConfig = { client: string; slot: string };

function adConfig(env: Bindings): AdConfig | null {
  if (env.ADSENSE_CLIENT_ID && env.ADSENSE_SLOT_ID) {
    return { client: env.ADSENSE_CLIENT_ID, slot: env.ADSENSE_SLOT_ID };
  }
  return null;
}

const COOKIE_OPTS = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' } as const;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// URL パラメータ経由のトグル → cookie 化 → param 無し URL に redirect。
app.use('*', async (c, next) => {
  const lang = c.req.query('lang');
  if (lang === 'ja' || lang === 'ko') {
    setCookie(c, 'locale', lang, COOKIE_OPTS);
    return c.redirect(c.req.path);
  }
  const theme = c.req.query('theme');
  if (theme === 'light' || theme === 'dark') {
    setCookie(c, 'theme', theme, COOKIE_OPTS);
    return c.redirect(c.req.path);
  }
  if (theme === 'auto') {
    deleteCookie(c, 'theme', { path: '/' });
    return c.redirect(c.req.path);
  }
  const direction = c.req.query('direction');
  if (direction === 'kr-to-jp' || direction === 'jp-to-kr') {
    setCookie(c, 'direction', direction, COOKIE_OPTS);
    return c.redirect(c.req.path);
  }

  c.set('locale', detectLocale(c));
  c.set('theme', detectTheme(c));
  c.set('direction', detectDirection(c));
  await next();
});

app.use('*', Layout);

app.get('/', async (c) => {
  // cookie で言語/テーマ/方向が変わるので中間キャッシュに「Cookie 別物扱い」を伝える。
  c.header('Vary', 'Cookie');
  const locale = c.get('locale');
  const theme = c.get('theme');
  const direction = c.get('direction');
  const [krRoutes, jpRoutes] = await Promise.all([
    Promise.all(KOREA_TO_JAPAN.map((r) => getRoutePayload(c.env, r))),
    Promise.all(JAPAN_TO_KOREA.map((r) => getRoutePayload(c.env, r))),
  ]);
  return c.render(
    <Home krRoutes={krRoutes} jpRoutes={jpRoutes} locale={locale} direction={direction} />,
    {
      title: 'SwimFare',
      ads: adConfig(c.env),
      locale,
      theme,
      path: c.req.path,
    },
  );
});

app.get('/routes/:route', async (c) => {
  const route = c.req.param('route');
  if (!isTrackedRoute(route)) return c.notFound();
  c.header('Vary', 'Cookie');
  const locale = c.get('locale');
  const theme = c.get('theme');
  // ルートのプレフィックスから方向を推定し、cookie を更新。
  // → 戻ったときホームが同じ方向で開く。
  setCookie(c, 'direction', routeDirection(route), COOKIE_OPTS);
  const [data, history] = await Promise.all([
    getRoutePayload(c.env, route),
    getRouteHistory(c.env, route),
  ]);
  return c.render(<RouteDetail data={data} history={history} locale={locale} />, {
    title: `${route} | SwimFare`,
    loadChart: true,
    ads: adConfig(c.env),
    locale,
    theme,
    path: c.req.path,
  });
});

app.get('/healthz', (c) => c.json({ ok: true }));

app.get('/api/routes/:route', async (c) => {
  const route = c.req.param('route');
  if (!isTrackedRoute(route)) return c.notFound();
  return c.json(await getRoutePayload(c.env, route));
});

app.get('/api/routes/:route/history', async (c) => {
  const route = c.req.param('route');
  if (!isTrackedRoute(route)) return c.notFound();
  return c.json(await getRouteHistory(c.env, route));
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      collectPrices(env).then((result) => {
        console.log('[cron] collectPrices', JSON.stringify(result));
      }),
    );
  },
};
