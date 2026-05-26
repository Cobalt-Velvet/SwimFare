import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { collectPrices } from './lib/collector';
import { getRoutePayload, getRouteHistory } from './lib/store';
import { TRACKED_ROUTES, isTrackedRoute } from './lib/routes';
import { detectLocale, detectTheme } from './i18n/locale';
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
};

export type AdConfig = { client: string; slot: string };

function adConfig(env: Bindings): AdConfig | null {
  if (env.ADSENSE_CLIENT_ID && env.ADSENSE_SLOT_ID) {
    return { client: env.ADSENSE_CLIENT_ID, slot: env.ADSENSE_SLOT_ID };
  }
  return null;
}

const COOKIE_OPTS = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' } as const;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Locale / theme の URL パラメータを cookie に保存し、param 無しで再描画させる。
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

  c.set('locale', detectLocale(c));
  c.set('theme', detectTheme(c));
  await next();
});

app.use('*', Layout);

app.get('/', async (c) => {
  const locale = c.get('locale');
  const theme = c.get('theme');
  const routes = await Promise.all(TRACKED_ROUTES.map((r) => getRoutePayload(c.env, r)));
  return c.render(<Home routes={routes} locale={locale} />, {
    title: 'SwimFare',
    ads: adConfig(c.env),
    locale,
    theme,
    path: c.req.path,
  });
});

app.get('/routes/:route', async (c) => {
  const route = c.req.param('route');
  if (!isTrackedRoute(route)) return c.notFound();
  const locale = c.get('locale');
  const theme = c.get('theme');
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

// 本番では scheduled を HTTP から直接叩く方法がないため、collector を同期実行できる管理エンドポイントを置く。
// 認証は Bearer + TRAVELPAYOUTS_TOKEN（既存の唯一のシークレット）を流用する。
app.post('/admin/run-cron', async (c) => {
  const auth = c.req.header('authorization');
  if (!auth || auth !== `Bearer ${c.env.TRAVELPAYOUTS_TOKEN}`) {
    return c.text('Forbidden', 403);
  }
  const result = await collectPrices(c.env);
  return c.json(result);
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
