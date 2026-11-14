import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import type { Departure, RoutePayload } from '../lib/store';
import { RouteSection, fmtDateLocal, fmtPct } from './route-section';
import { airlineLabel, routeLabel, STRINGS, type Locale, type Strings } from '../i18n/strings';
import type { Direction } from '../lib/routes';

const TOGGLE_JS = `
(function () {
  var home = document.querySelector('.home');
  var buttons = document.querySelectorAll('[data-set-direction]');
  var panes = document.querySelectorAll('.direction-pane');
  if (!home || !buttons.length || !panes.length) return;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var DURATION = reduced ? 0 : 400;
  var busy = false;
  function setDirection(dir) {
    if (busy || home.dataset.direction === dir) return;
    busy = true;
    home.dataset.direction = dir;
    buttons.forEach(function (b) {
      var on = b.dataset.setDirection === dir;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    panes.forEach(function (p) {
      var on = p.dataset.pane === dir;
      if (on) p.removeAttribute('inert');
      else p.setAttribute('inert', '');
    });
    document.cookie = 'direction=' + dir + '; path=/; max-age=31536000; SameSite=Lax';
    window.setTimeout(function () { busy = false; }, DURATION);
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setDirection(b.dataset.setDirection); });
  });
})();
`;

type Pick = { route: string; d: Departure; avg: number; pct: number };

// その方向で、過去30日の平均を最も大きく下回っている便。平均より安い便が無ければ null。
function deepestDive(routes: RoutePayload[]): Pick | null {
  let best: Pick | null = null;
  for (const r of routes) {
    for (const d of r.departures) {
      const j = d.judgment;
      if (j.verdict === 'insufficient_data' || j.deviation_pct >= 0) continue;
      if (!best || j.deviation_pct < best.pct) {
        best = { route: r.route, d, avg: j.avg_price, pct: j.deviation_pct };
      }
    }
  }
  return best;
}

const SURFACE_Y = 36;

const Feature: FC<{ dir: Direction; pick: Pick; t: Strings }> = ({ dir, pick, t }) => {
  // 1% を 1.3px の深さに。浅すぎて水面に重ならないよう最小 12px、最大 78px。
  const depth = Math.max(12, Math.min(78, -pick.pct * 1.3));
  const dotY = SURFACE_Y + 1 + depth;
  const airline = airlineLabel(pick.d.airline, t);
  return (
    <aside class="feature" data-feature={dir}>
      <div class="feature-head">
        <p class="feature-kicker">{t.featureTitle}</p>
        <p class="feature-route">
          <a href={`/routes/${pick.route}`}>{routeLabel(pick.route, t)}</a>
        </p>
        <p class="feature-price num">
          {pick.d.price.toLocaleString()}
          <span class="unit">{pick.d.currency}</span>
        </p>
        <p class="feature-meta">
          {fmtDateLocal(pick.d.departure_date, t)}
          {t.departureSuffix} · {t.daysBefore(pick.d.days_before)}
          {airline ? ` · ${airline}` : ''}
        </p>
      </div>
      <div class="gauge" aria-hidden="true">
        <span class="surface-label">
          {t.featureAvg} <b class="num">{pick.avg.toLocaleString()}</b>
        </span>
        <div class="water"></div>
        <div class="plumb" style={`height:${depth}px`}></div>
        <div class="dot" style={`top:${dotY}px`}></div>
        <span class="depth num" style={`top:${dotY}px`}>
          {fmtPct(pick.pct)}
        </span>
      </div>
    </aside>
  );
};

type PaneProps = { dir: Direction; activeDir: Direction; locale: Locale; routes: RoutePayload[] };

const Pane: FC<PaneProps> = ({ dir, activeDir, locale, routes }) => {
  const inactive = dir !== activeDir;
  return (
    <div class="direction-pane" data-pane={dir} inert={inactive}>
      {routes.map((r) => (
        <RouteSection data={r} locale={locale} linkTitle />
      ))}
    </div>
  );
};

export const Home: FC<{
  krRoutes: RoutePayload[];
  jpRoutes: RoutePayload[];
  locale: Locale;
  direction: Direction;
}> = ({ krRoutes, jpRoutes, locale, direction }) => {
  const t = STRINGS[locale];
  const krPick = deepestDive(krRoutes);
  const jpPick = deepestDive(jpRoutes);
  const hasFeature = Boolean(krPick || jpPick);
  return (
    <div class="home" data-direction={direction}>
      <section class={`hero${hasFeature ? ' has-feature' : ''}`}>
        <div>
          <h1>{t.catchphrase}</h1>
          <p class="lead">{t.lead}</p>
          <div class="seg lg" role="group" aria-label={t.direction.label}>
            <button
              type="button"
              data-set-direction="kr-to-jp"
              aria-pressed={direction === 'kr-to-jp'}
              class={direction === 'kr-to-jp' ? 'active' : ''}
            >
              {t.direction.krToJp}
            </button>
            <button
              type="button"
              data-set-direction="jp-to-kr"
              aria-pressed={direction === 'jp-to-kr'}
              class={direction === 'jp-to-kr' ? 'active' : ''}
            >
              {t.direction.jpToKr}
            </button>
          </div>
        </div>
        {krPick ? <Feature dir="kr-to-jp" pick={krPick} t={t} /> : null}
        {jpPick ? <Feature dir="jp-to-kr" pick={jpPick} t={t} /> : null}
      </section>

      <div class="legend">
        <span class="note">{t.legendNote}</span>
        <span class="verdict cheap">{t.legendCheap}</span>
        <span class="verdict normal">{t.legendNormal}</span>
        <span class="verdict expensive">{t.legendExpensive}</span>
      </div>

      <div class="directions-wrap">
        <div class="directions-track">
          <Pane dir="kr-to-jp" activeDir={direction} locale={locale} routes={krRoutes} />
          <Pane dir="jp-to-kr" activeDir={direction} locale={locale} routes={jpRoutes} />
        </div>
      </div>
      <script>{raw(TOGGLE_JS)}</script>
    </div>
  );
};
