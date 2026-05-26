import type { FC } from 'hono/jsx';
import type { Departure, RoutePayload } from '../lib/store';
import type { Judgment } from '../lib/judgment';
import { airlineLabel, routeLabel, STRINGS, type Locale, type Strings } from '../i18n/strings';

function fmtDateLocal(yyyymmdd: string, t: Strings): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${t.weekDay[d.getUTCDay()]})`;
}

const Badge: FC<{ j: Judgment; t: Strings }> = ({ j, t }) => {
  if (j.verdict === 'insufficient_data') {
    return <span class="badge collecting">{t.badge.collecting(j.sample_count, j.required)}</span>;
  }
  const label =
    j.verdict === 'cheap' ? t.badge.cheap : j.verdict === 'expensive' ? t.badge.expensive : t.badge.normal;
  const sign = j.deviation_pct > 0 ? '+' : '';
  return (
    <span class={`badge ${j.verdict}`}>
      {label} {sign}
      {j.deviation_pct}%
    </span>
  );
};

const DepartureCard: FC<{ d: Departure; t: Strings }> = ({ d, t }) => (
  <article class="dep">
    <div class="dep-date">
      {fmtDateLocal(d.departure_date, t)}
      {t.departureSuffix}
    </div>
    <div class="dep-price">
      {d.price.toLocaleString()}
      <span class="unit">{d.currency}</span>
    </div>
    <div class="dep-meta">{t.daysBefore(d.days_before)}</div>
    {d.airline ? <div class="dep-airline">{airlineLabel(d.airline, t)}</div> : null}
    <Badge j={d.judgment} t={t} />
  </article>
);

export const RouteSection: FC<{ data: RoutePayload; locale: Locale; linkTitle?: boolean }> = ({
  data,
  locale,
  linkTitle,
}) => {
  const t = STRINGS[locale];
  const hasStrongCheap = data.departures.some(
    (d) => d.judgment.verdict === 'cheap' && d.judgment.deviation_pct <= -10,
  );
  return (
    <section class={`route-card${hasStrongCheap ? ' has-cheap' : ''}`}>
      <h2>
        {linkTitle ? (
          <a href={`/routes/${data.route}`}>{routeLabel(data.route, t)}</a>
        ) : (
          routeLabel(data.route, t)
        )}
      </h2>
      <p class="observed">
        {data.route} ・ {t.observed}: {data.observed_date}
      </p>
      {data.departures.length === 0 ? (
        <p class="empty-note">{t.emptyRoute}</p>
      ) : (
        <div class="deps-grid">
          {data.departures.map((d) => (
            <DepartureCard d={d} t={t} />
          ))}
        </div>
      )}
    </section>
  );
};
