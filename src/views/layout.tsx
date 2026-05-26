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

const css = `
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-muted: #f8fafc;
  --text: #0f172a;
  --text-muted: #475569;
  --text-faint: #64748b;
  --border: #e2e8f0;
  --border-dashed: #cbd5e1;
  --link: #0284c7;
  --header-bg: linear-gradient(135deg, #0ea5e9, #0284c7);
  --header-text: #ffffff;
  --toggle-bg: rgba(255,255,255,0.15);
  --toggle-active-bg: rgba(255,255,255,0.95);
  --toggle-active-text: #0f172a;
  --toggle-border: rgba(255,255,255,0.3);
  --badge-cheap-bg: #dcfce7;
  --badge-cheap-fg: #166534;
  --badge-normal-bg: #f1f5f9;
  --badge-normal-fg: #475569;
  --badge-expensive-bg: #fee2e2;
  --badge-expensive-fg: #991b1b;
  --badge-collecting-bg: #dbeafe;
  --badge-collecting-fg: #1e40af;
  --card-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  --glow-bg: linear-gradient(135deg, #ffffff 0%, #fdf2f8 55%, #fce7f3 100%);
  --glow-shadow: 0 0 22px rgba(236, 72, 153, 0.22), 0 1px 3px rgba(15, 23, 42, 0.06);
  --ad-faint: #94a3b8;
  --chart-line: #94a3b8;
  --chart-grid: rgba(15, 23, 42, 0.08);
  --chart-text: #475569;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #0f172a;
    --surface: #1e293b;
    --surface-muted: #172033;
    --text: #f1f5f9;
    --text-muted: #cbd5e1;
    --text-faint: #94a3b8;
    --border: #334155;
    --border-dashed: #475569;
    --link: #38bdf8;
    --header-bg: linear-gradient(135deg, #075985, #0c4a6e);
    --header-text: #f1f5f9;
    --toggle-bg: rgba(255,255,255,0.08);
    --toggle-active-bg: rgba(255,255,255,0.92);
    --toggle-active-text: #0f172a;
    --toggle-border: rgba(255,255,255,0.18);
    --badge-cheap-bg: #14532d;
    --badge-cheap-fg: #86efac;
    --badge-normal-bg: #334155;
    --badge-normal-fg: #cbd5e1;
    --badge-expensive-bg: #7f1d1d;
    --badge-expensive-fg: #fca5a5;
    --badge-collecting-bg: #1e3a8a;
    --badge-collecting-fg: #93c5fd;
    --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    --glow-bg: linear-gradient(135deg, #1e293b 0%, #3b1f33 55%, #571438 100%);
    --glow-shadow: 0 0 28px rgba(244, 114, 182, 0.4), 0 1px 3px rgba(0, 0, 0, 0.4);
    --ad-faint: #475569;
    --chart-line: #64748b;
    --chart-grid: rgba(241, 245, 249, 0.08);
    --chart-text: #cbd5e1;
  }
}

[data-theme='dark'] {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-muted: #172033;
  --text: #f1f5f9;
  --text-muted: #cbd5e1;
  --text-faint: #94a3b8;
  --border: #334155;
  --border-dashed: #475569;
  --link: #38bdf8;
  --header-bg: linear-gradient(135deg, #075985, #0c4a6e);
  --header-text: #f1f5f9;
  --toggle-bg: rgba(255,255,255,0.08);
  --toggle-active-bg: rgba(255,255,255,0.92);
  --toggle-active-text: #0f172a;
  --toggle-border: rgba(255,255,255,0.18);
  --badge-cheap-bg: #14532d;
  --badge-cheap-fg: #86efac;
  --badge-normal-bg: #334155;
  --badge-normal-fg: #cbd5e1;
  --badge-expensive-bg: #7f1d1d;
  --badge-expensive-fg: #fca5a5;
  --badge-collecting-bg: #1e3a8a;
  --badge-collecting-fg: #93c5fd;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  --glow-bg: linear-gradient(135deg, #1e293b 0%, #3b1f33 55%, #571438 100%);
  --glow-shadow: 0 0 28px rgba(244, 114, 182, 0.4), 0 1px 3px rgba(0, 0, 0, 0.4);
  --ad-faint: #475569;
  --chart-line: #64748b;
  --chart-grid: rgba(241, 245, 249, 0.08);
  --chart-text: #cbd5e1;
}

* { box-sizing: border-box; }
html, body { background: var(--bg); }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Noto Sans KR", sans-serif;
  margin: 0;
  color: var(--text);
  line-height: 1.5;
}
a { color: inherit; }

.site-header {
  background: var(--header-bg);
  color: var(--header-text);
  padding: 1.5rem 1.25rem 1.1rem;
  text-align: center;
}
.brand {
  display: inline-block;
  color: var(--header-text);
  text-decoration: none;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.catchphrase { margin: 0.4rem 0 0.9rem; opacity: 0.92; font-size: 0.95rem; }

.toggles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  font-size: 0.8rem;
}
.toggle-group {
  display: inline-flex;
  background: var(--toggle-bg);
  border: 1px solid var(--toggle-border);
  border-radius: 999px;
  padding: 2px;
  align-items: stretch;
}
.toggle-group > a {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--header-text);
  opacity: 0.85;
  line-height: 1.2;
}
.toggle-group > a:hover { opacity: 1; }
.toggle-group > a.active {
  background: var(--toggle-active-bg);
  color: var(--toggle-active-text);
  opacity: 1;
  font-weight: 600;
}

main { max-width: 960px; margin: 0 auto; padding: 1.5rem 1.25rem; }
.lead { color: var(--text-muted); margin: 0 0 1rem; }
.back-link { color: var(--link); text-decoration: none; font-size: 0.9rem; }
.back-link:hover { text-decoration: underline; }

.direction-toggle {
  display: flex;
  gap: 0.25rem;
  margin: 0.5rem auto 1.25rem;
  background: var(--surface);
  border-radius: 999px;
  padding: 5px;
  box-shadow: var(--card-shadow);
  width: fit-content;
}
.direction-toggle button {
  font: inherit;
  font-size: 1rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.direction-toggle button:hover { color: var(--text); }
.direction-toggle button.active {
  background: var(--link);
  color: var(--header-text);
  font-weight: 600;
}
@media (prefers-reduced-motion: reduce) {
  .direction-toggle button { transition: none; }
}

.directions-wrap {
  overflow: hidden;
  /* スライドが上下の他要素と干渉しないように高さは中身で決まる */
}
.directions-track {
  display: flex;
  width: 200%;
  transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
.directions-wrap[data-direction="kr-to-jp"] .directions-track { transform: translateX(0%); }
.directions-wrap[data-direction="jp-to-kr"] .directions-track { transform: translateX(-50%); }
.direction-pane {
  flex: 0 0 50%;
  width: 50%;
  min-width: 0;
}
@media (prefers-reduced-motion: reduce) {
  .directions-track { transition: none; }
}

.route-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s ease;
}
.route-card.has-cheap {
  background: var(--glow-bg);
  box-shadow: var(--glow-shadow);
}
.route-card h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
.route-card h2 a { color: var(--link); text-decoration: none; }
.route-card h2 a:hover { text-decoration: underline; }
.route-card .observed { color: var(--text-faint); font-size: 0.8rem; margin: 0 0 1rem; }

.deps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}
.dep {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem;
  background: var(--surface-muted);
}
.dep-date { font-weight: 600; font-size: 0.9rem; color: var(--text-muted); }
.dep-price { font-size: 1.4rem; font-weight: 700; margin: 0.25rem 0 0; color: var(--text); }
.dep-price .unit { font-size: 0.8rem; font-weight: normal; color: var(--text-faint); margin-left: 0.2rem; }
.dep-meta { font-size: 0.8rem; color: var(--text-faint); margin: 0.1rem 0 0.1rem; }
.dep-airline { font-size: 0.78rem; color: var(--text-muted); margin: 0 0 0.5rem; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
}
.badge.cheap     { background: var(--badge-cheap-bg);     color: var(--badge-cheap-fg); }
.badge.normal    { background: var(--badge-normal-bg);    color: var(--badge-normal-fg); }
.badge.expensive { background: var(--badge-expensive-bg); color: var(--badge-expensive-fg); }
.badge.collecting{ background: var(--badge-collecting-bg);color: var(--badge-collecting-fg); }

.empty-note {
  color: var(--text-faint);
  font-style: italic;
  margin: 0;
}

.chart-section {
  background: var(--surface);
  padding: 1.25rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  box-shadow: var(--card-shadow);
}
.chart-section h2 { margin: 0 0 0.25rem; font-size: 1.1rem; }
.chart-section p.help { color: var(--text-faint); font-size: 0.85rem; margin: 0 0 1rem; }
.chart-wrap {
  position: relative;
  height: 360px;
  width: 100%;
}

.ad-slot {
  max-width: 960px;
  min-height: 90px;
  margin: 1.5rem auto;
  padding: 0 1.25rem;
}
.ad-slot-inner {
  height: 90px;
  border: 1px dashed var(--border-dashed);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ad-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}
.site-footer {
  max-width: 960px;
  margin: 0 auto 2rem;
  padding: 0 1.25rem;
  color: var(--text-faint);
  font-size: 0.8rem;
  text-align: center;
}
.site-footer p { margin: 0; }
`;

function withParam(path: string, key: string, value: string): string {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

export const Layout = jsxRenderer(({ children, title, loadChart, ads, locale, theme, path }) => {
  const t = STRINGS[locale];
  const themeAttr = theme === 'light' || theme === 'dark' ? theme : undefined;
  return (
    <html lang={locale} {...(themeAttr ? { 'data-theme': themeAttr } : {})}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ?? 'SwimFare'}</title>
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
        <header class="site-header">
          <a href="/" class="brand">SwimFare</a>
          <p class="catchphrase">{t.catchphrase}</p>
          <div class="toggles">
            <span class="toggle-group" role="group" aria-label={t.langLabel}>
              <a href={withParam(path, 'lang', 'ja')} class={`toggle${locale === 'ja' ? ' active' : ''}`}>
                日本語
              </a>
              <a href={withParam(path, 'lang', 'ko')} class={`toggle${locale === 'ko' ? ' active' : ''}`}>
                한국어
              </a>
            </span>
            <span class="toggle-group" role="group" aria-label={t.themeLabel}>
              <a href={withParam(path, 'theme', 'light')} class={`toggle${theme === 'light' ? ' active' : ''}`}>
                {t.themeLight}
              </a>
              <a href={withParam(path, 'theme', 'dark')} class={`toggle${theme === 'dark' ? ' active' : ''}`}>
                {t.themeDark}
              </a>
              <a href={withParam(path, 'theme', 'auto')} class={`toggle${theme === null ? ' active' : ''}`}>
                {t.themeAuto}
              </a>
            </span>
          </div>
        </header>
        <main>{children}</main>
        <aside class="ad-slot" aria-label="ads">
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
          <p>{t.footer}</p>
        </footer>
        {loadChart ? (
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        ) : null}
      </body>
    </html>
  );
});
