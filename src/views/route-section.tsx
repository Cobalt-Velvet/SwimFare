import type { FC } from 'hono/jsx';
import type { Departure, RoutePayload } from '../lib/store';
import { STRONG_CHEAP_PCT, type Judgment } from '../lib/judgment';
import { airlineLabel, routeLabel, STRINGS, type Locale, type Strings } from '../i18n/strings';

export function fmtDateLocal(yyyymmdd: string, t: Strings): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${t.weekDay[d.getUTCDay()]})`;
}

// 乖離率は常に小数1桁、マイナスは U+2212。
export function fmtPct(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '±';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

const Verdict: FC<{ j: Judgment; t: Strings }> = ({ j, t }) => {
  if (j.verdict === 'insufficient_data') {
    return <span class="verdict collecting">{t.badge.collecting(j.sample_count, j.required)}</span>;
  }
  const label =
    j.verdict === 'cheap' ? t.badge.cheap : j.verdict === 'expensive' ? t.badge.expensive : t.badge.normal;
  return (
    <span class={`verdict ${j.verdict}`}>
      {label} <span class="num">{fmtPct(j.deviation_pct)}</span>
    </span>
  );
};

const DepartureCell: FC<{ d: Departure; t: Strings }> = ({ d, t }) => {
  const airline = airlineLabel(d.airline, t);
  return (
    <article class="dep">
      <div class="dep-date">
        {fmtDateLocal(d.departure_date, t)}
        {t.departureSuffix}
      </div>
      <div class="dep-price num">
        {d.price.toLocaleString()}
        <span class="unit">{d.currency}</span>
      </div>
      <div class="dep-meta" title={airline || undefined}>
        {t.daysBefore(d.days_before)}
        {airline ? ` · ${airline}` : ''}
      </div>
      <Verdict j={d.judgment} t={t} />
    </article>
  );
};

export const RouteSection: FC<{ data: RoutePayload; locale: Locale; linkTitle?: boolean }> = ({
  data,
  locale,
  linkTitle,
}) => {
  const t = STRINGS[locale];
  const hasStrongCheap = data.departures.some(
    (d) => d.judgment.verdict === 'cheap' && d.judgment.deviation_pct <= STRONG_CHEAP_PCT,
  );
  return (
    <section class={`route-card${hasStrongCheap ? ' has-cheap' : ''}`}>
      <div class="route-head">
        <h2>
          {linkTitle ? (
            <a href={`/routes/${data.route}`}>{routeLabel(data.route, t)}</a>
          ) : (
            routeLabel(data.route, t)
          )}
        </h2>
        <p class="observed">
          {t.observed} <span class="num">{data.observed_date}</span>
        </p>
      </div>
      {data.departures.length === 0 ? (
        <p class="empty-note">{t.emptyRoute}</p>
      ) : (
        <div class="deps">
          {data.departures.map((d) => (
            <DepartureCell d={d} t={t} />
          ))}
        </div>
      )}
    </section>
  );
};
