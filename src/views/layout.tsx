import { jsxRenderer } from 'hono/jsx-renderer';
import { raw } from 'hono/html';
import { STRINGS, type Locale, type ThemePref } from '../i18n/strings';

type AdProps = { client: string; slot: string };

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props: {
        title?: string;
        loadChart?: boolean;
        ads?: AdProps | null;
        locale: Locale;
        theme: ThemePref;
        path: string;
      },
    ): Response | Promise<Response>;
  }
}

// 色はすべてインクのニュートラル＋海の青ひとつ。「水面より下＝割安」を色の意味に揃える。
const LIGHT = `
  --bg: #f5f7fa;
  --surface: #ffffff;
  --raised: #eceff4;
  --text: #111827;
  --text-2: #4b5565;
  --text-3: #6b7487;
  --line: rgba(17, 24, 39, 0.09);
  --line-strong: rgba(17, 24, 39, 0.16);
  --accent: #0369a1;
  --water: rgba(3, 105, 161, 0.10);
  --water-deep: rgba(3, 105, 161, 0.18);
  --negative: #c42b2b;
  --shadow-sm: 0 1px 2px rgba(17, 24, 39, 0.05);
`;
const DARK = `
  --bg: #0b0d14;
  --surface: #11141c;
  --raised: #1a1e28;
  --text: #eef0f5;
  --text-2: #a3a9b8;
  --text-3: #7a8296;
  --line: rgba(238, 240, 245, 0.08);
  --line-strong: rgba(238, 240, 245, 0.14);
  --accent: #5cb6e6;
  --water: rgba(92, 182, 230, 0.10);
  --water-deep: rgba(92, 182, 230, 0.20);
  --negative: #e5484d;
  --shadow-sm: none;
`;

const css = `
:root { ${LIGHT} color-scheme: light; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { ${DARK} color-scheme: dark; }
}
:root[data-theme='dark'] { ${DARK} color-scheme: dark; }

* { box-sizing: border-box; }
html, body { background: var(--bg); }
body {
  margin: 0;
  color: var(--text);
  font-size: 15px;
  line-height: 1.6;
  font-family: "IBM Plex Sans JP", "IBM Plex Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Noto Sans KR", sans-serif;
  -webkit-font-smoothing: antialiased;
}
html[lang='ko'] body {
  font-family: "IBM Plex Sans KR", "IBM Plex Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
}
html[lang='ko'] body { word-break: keep-all; overflow-wrap: anywhere; }
a { color: inherit; }
.mono, .num { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
.num { font-variant-numeric: tabular-nums; }
.dep-price.num, .feature-price.num { font-family: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

/* ── Top bar ───────────────────────── */
.topbar { border-bottom: 1px solid var(--line); }
.topbar .container {
  min-height: 56px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 17px;
  font-weight: 600;
  line-height: 1;
  color: var(--text);
}
.brand svg { color: var(--accent); }
.prefs { display: flex; gap: 8px; }

.seg {
  display: inline-flex;
  padding: 2px;
  gap: 2px;
  background: var(--raised);
  border-radius: 8px;
}
.seg > a, .seg > button {
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-2);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
.seg > a:hover, .seg > button:hover { color: var(--text); }
.seg > .active {
  background: var(--surface);
  color: var(--text);
  font-weight: 500;
  box-shadow: 0 0 0 1px var(--line), var(--shadow-sm);
}
.seg.lg { padding: 4px; border-radius: 10px; gap: 4px; }
.seg.lg > button { font-size: 15px; padding: 10px 20px; }

main { padding-top: 32px; padding-bottom: 32px; }

/* ── Hero ─────────────────────────── */
.hero {
  display: grid;
  gap: 32px;
  align-items: center;
  padding: 24px 0 48px;
}
.hero.has-feature { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.hero h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.01em;
  word-break: auto-phrase;
  text-wrap: balance;
}
.hero .lead {
  margin: 16px 0 32px;
  max-width: 34rem;
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-2);
}

/* 今日いちばん割安な便：水面＝過去30日の平均、価格の点はその下に沈む */
.feature {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.feature-head { padding: 20px 24px 0; }
.feature-kicker { margin: 0; font-size: 13px; color: var(--text-3); }
.feature-route { margin: 4px 0 0; font-size: 15px; font-weight: 500; }
.feature-route a { text-decoration: none; }
.feature-route a:hover { color: var(--accent); }
.feature-price { margin: 16px 0 0; font-size: 40px; line-height: 1; font-weight: 500; }
.feature-price .unit { font-size: 13px; color: var(--text-3); margin-left: 4px; font-weight: 400; }
.feature-meta { margin: 8px 0 0; font-size: 13px; color: var(--text-2); }
.gauge { position: relative; height: 128px; margin-top: 16px; }
.gauge .water {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  top: 36px;
  background: linear-gradient(var(--water-deep), var(--water) 70%);
  border-top: 2px solid var(--accent);
}
.gauge .surface-label {
  position: absolute;
  left: 24px; top: 12px;
  font-size: 12px;
  color: var(--text-3);
}
.gauge .surface-label b { font-weight: 500; color: var(--text-2); }
.gauge .plumb {
  position: absolute;
  left: 68%;
  top: 37px;
  width: 0;
  border-left: 1px dashed var(--accent);
}
.gauge .dot {
  position: absolute;
  left: 68%;
  width: 12px; height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: var(--text);
  box-shadow: 0 0 0 3px var(--surface);
}
.gauge .depth {
  position: absolute;
  left: calc(68% + 16px);
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  transform: translateY(-50%);
}

/* ── Direction slide ─────────────────── */
.directions-wrap { overflow: hidden; }
.directions-track {
  display: flex;
  width: 200%;
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.home[data-direction="kr-to-jp"] .directions-track { transform: translateX(0%); }
.home[data-direction="jp-to-kr"] .directions-track { transform: translateX(-50%); }
.home[data-direction="kr-to-jp"] [data-feature="jp-to-kr"],
.home[data-direction="jp-to-kr"] [data-feature="kr-to-jp"] { display: none; }
.direction-pane { flex: 0 0 50%; width: 50%; min-width: 0; }
@media (prefers-reduced-motion: reduce) {
  .directions-track, .seg > a, .seg > button { transition: none; }
}

/* ── Legend ───────────────────────── */
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-3);
}
.legend .note { margin-right: auto; }
.legend .verdict { margin-top: 0; font-weight: 400; }

/* ── Route card ───────────────────── */
.route-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}
/* 平均より30%以上安い便を含む路線：「割安」と同じ海の青で枠線を引く */
.route-card.has-cheap { border-color: var(--accent); }
.route-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 20px 24px 16px;
}
.route-head h2 { margin: 0; font-size: 18px; line-height: 1.4; font-weight: 500; }
.route-head h2 a { text-decoration: none; }
.route-head h2 a:hover { color: var(--accent); }
.route-head .observed { margin: 0; font-size: 12px; color: var(--text-3); }

.deps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); }
.dep { padding: 16px 24px 20px; border-left: 1px solid var(--line); }
.dep:nth-child(4n + 1) { border-left: 0; }
.dep-date { font-size: 13px; color: var(--text-2); }
.dep-price { margin-top: 8px; font-size: 24px; line-height: 1.2; font-weight: 500; }
.dep-price .unit { font-size: 12px; font-weight: 400; color: var(--text-3); margin-left: 4px; }
.dep-meta { margin-top: 4px; font-size: 12px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.verdict { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--text-2); }
.verdict::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
.verdict.cheap { color: var(--accent); font-weight: 500; }
.verdict.expensive { color: var(--negative); }
.verdict.normal { color: var(--text-2); }
.verdict.collecting { color: var(--text-3); }
.verdict.collecting::before { background: transparent; box-shadow: inset 0 0 0 1.5px currentColor; }

.empty-note { margin: 0; padding: 16px 24px 20px; border-top: 1px solid var(--line); font-size: 14px; color: var(--text-3); }

/* ── Route detail ─────────────────── */
.back-link { display: inline-block; margin-bottom: 16px; font-size: 14px; color: var(--text-2); text-decoration: none; }
.back-link:hover { color: var(--accent); }
.chart-section {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  padding: 24px;
  margin-top: 24px;
}
.chart-section h2 { margin: 0; font-size: 18px; font-weight: 500; }
.chart-section .help { margin: 8px 0 20px; max-width: 44rem; font-size: 14px; color: var(--text-2); }
.chart-section .empty-note { padding: 0; border: 0; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 12px; font-size: 13px; color: var(--text-2); }
.chart-legend span { display: inline-flex; align-items: center; gap: 8px; }
.swatch-water { width: 20px; height: 10px; border-top: 2px solid var(--accent); background: var(--water-deep); }
.swatch-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--text); }
.chart-legend .unit { margin-left: auto; color: var(--text-3); }
.chart-wrap { position: relative; height: 360px; width: 100%; }

/* ── Ad + footer ──────────────────── */
.ad-slot { min-height: 90px; margin: 16px auto 32px; }
.ad-slot-inner {
  height: 90px;
  border: 1px dashed var(--line-strong);
  border-radius: 12px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.site-footer { border-top: 1px solid var(--line); }
.site-footer p { margin: 0; padding: 24px 0 40px; font-size: 13px; color: var(--text-3); }

/* ── Small screens ────────────────── */
@media (max-width: 880px) {
  .hero.has-feature { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 720px) {
  .container { padding: 0 16px; }
  main { padding-top: 16px; }
  .hero { padding: 16px 0 32px; gap: 24px; }
  .hero h1 { font-size: 28px; }
  .hero .lead { font-size: 15px; margin: 12px 0 24px; }
  .seg.lg { display: flex; }
  .seg.lg > button { flex: 1; padding: 10px 12px; }
  .route-head { padding: 16px 16px 12px; }
  .deps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dep { padding: 12px 16px 16px; }
  .dep:nth-child(4n + 1) { border-left: 1px solid var(--line); }
  .dep:nth-child(2n + 1) { border-left: 0; }
  .dep:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .dep-price { font-size: 20px; }
  .feature-head { padding: 16px 16px 0; }
  .gauge .surface-label { left: 16px; }
  .chart-section { padding: 16px; }
  .chart-wrap { height: 280px; }
}
`;

const FONT_FAMILIES: Record<Locale, string> = {
  ja: 'IBM+Plex+Sans+JP:wght@400;500;600',
  ko: 'IBM+Plex+Sans+KR:wght@400;500;600',
};

function withParam(path: string, key: string, value: string): string {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

// 水面の波ひとつ。ロゴのマーク。
const Mark = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
    <path
      d="M1 9c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 3 3"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const Layout = jsxRenderer(({ children, title, loadChart, ads, locale, theme, path }) => {
  const t = STRINGS[locale];
  const themeAttr = theme === 'light' || theme === 'dark' ? theme : undefined;
  return (
    <html lang={locale} {...(themeAttr ? { 'data-theme': themeAttr } : {})}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ?? 'SwimFare'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${FONT_FAMILIES[locale]}&family=IBM+Plex+Mono:wght@400;500&display=swap`}
        />
        <style>{raw(css)}</style>
        {ads ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}`}
            crossorigin="anonymous"
          ></script>
        ) : null}
      </head>
      <body>
        <header class="topbar">
          <div class="container">
            <a href="/" class="brand">
              <Mark />
              SwimFare
            </a>
            <div class="prefs">
              <span class="seg" role="group" aria-label={t.langLabel}>
                <a href={withParam(path, 'lang', 'ja')} class={locale === 'ja' ? 'active' : ''}>
                  日本語
                </a>
                <a href={withParam(path, 'lang', 'ko')} class={locale === 'ko' ? 'active' : ''}>
                  한국어
                </a>
              </span>
              <span class="seg" role="group" aria-label={t.themeLabel}>
                <a href={withParam(path, 'theme', 'light')} class={theme === 'light' ? 'active' : ''}>
                  {t.themeLight}
                </a>
                <a href={withParam(path, 'theme', 'dark')} class={theme === 'dark' ? 'active' : ''}>
                  {t.themeDark}
                </a>
                <a href={withParam(path, 'theme', 'auto')} class={theme === null ? 'active' : ''}>
                  {t.themeAuto}
                </a>
              </span>
            </div>
          </div>
        </header>
        <main class="container">{children}</main>
        <aside class="ad-slot container" aria-label="ads">
          {ads ? (
            <>
              <ins
                class="adsbygoogle"
                style="display:block"
                data-ad-client={ads.client}
                data-ad-slot={ads.slot}
                data-ad-format="auto"
                data-full-width-responsive="true"
              ></ins>
              <script>{raw('(adsbygoogle = window.adsbygoogle || []).push({});')}</script>
            </>
          ) : (
            <div class="ad-slot-inner">{t.adPlaceholder}</div>
          )}
        </aside>
        <footer class="site-footer">
          <div class="container">
            <p>{t.footer}</p>
          </div>
        </footer>
        {loadChart ? (
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        ) : null}
      </body>
    </html>
  );
});
