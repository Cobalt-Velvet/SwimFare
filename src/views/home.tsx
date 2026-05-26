import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import type { RoutePayload } from '../lib/store';
import { RouteSection } from './route-section';
import { STRINGS, type Locale } from '../i18n/strings';
import type { Direction } from '../lib/routes';

const TOGGLE_JS = `
(function () {
  var wrap = document.querySelector('.directions-wrap');
  var buttons = document.querySelectorAll('[data-set-direction]');
  var panes = document.querySelectorAll('.direction-pane');
  if (!wrap || !buttons.length || !panes.length) return;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var DURATION = reduced ? 0 : 420;
  var busy = false;
  function setDirection(dir) {
    if (busy || wrap.dataset.direction === dir) return;
    busy = true;
    wrap.dataset.direction = dir;
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
  return (
    <>
      <p class="lead">{t.lead}</p>
      <div class="direction-toggle" role="group" aria-label={t.direction.label}>
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
      <div class="directions-wrap" data-direction={direction}>
        <div class="directions-track">
          <Pane dir="kr-to-jp" activeDir={direction} locale={locale} routes={krRoutes} />
          <Pane dir="jp-to-kr" activeDir={direction} locale={locale} routes={jpRoutes} />
        </div>
      </div>
      <script>{raw(TOGGLE_JS)}</script>
    </>
  );
};
