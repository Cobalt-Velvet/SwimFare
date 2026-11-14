import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import type { RoutePayload, HistoryPoint } from '../lib/store';
import { RouteSection } from './route-section';
import { STRINGS, type Locale } from '../i18n/strings';

type TodayPoint = { x: number; y: number };

export const RouteDetail: FC<{
  data: RoutePayload;
  history: HistoryPoint[];
  locale: Locale;
}> = ({ data, history, locale }) => {
  const t = STRINGS[locale];
  const today: TodayPoint[] = data.departures.map((d) => ({ x: d.days_before, y: d.price }));
  const avg = history.map((h) => ({ x: h.days_before, y: h.avg_price }));
  const chartReady = avg.length > 0 && today.length > 0;
  const currency = data.departures[0]?.currency ?? 'JPY';

  return (
    <>
      <a href="/" class="back-link">
        {t.backLink}
      </a>
      <RouteSection data={data} locale={locale} />

      <section class="chart-section">
        <h2>{t.chartTitle}</h2>
        <p class="help">{t.chartHelp}</p>
        {chartReady ? (
          <>
            <div class="chart-legend">
              <span>
                <i class="swatch-water"></i>
                {t.chartLegendAvg}
              </span>
              <span>
                <i class="swatch-dot"></i>
                {t.chartLegendToday}
              </span>
              <span class="unit mono">{currency}</span>
            </div>
            <div class="chart-wrap">
              <canvas id="price-chart" aria-label={t.chartTitle} role="img"></canvas>
            </div>
          </>
        ) : (
          <p class="empty-note">{t.chartEmpty}</p>
        )}
      </section>

      {chartReady ? (
        <script>
          {raw(`
            (function () {
              const avg = ${JSON.stringify(avg)};
              const today = ${JSON.stringify(today)};
              const labels = {
                avg: ${JSON.stringify(t.chartLegendAvg)},
                today: ${JSON.stringify(t.chartLegendToday)},
                x: ${JSON.stringify(t.chartXLabel)},
              };
              let chart = null;
              function token(style, name, fallback) {
                return style.getPropertyValue(name).trim() || fallback;
              }
              function render() {
                const ctx = document.getElementById('price-chart');
                if (!ctx || typeof Chart === 'undefined') return;
                const s = getComputedStyle(document.documentElement);
                const accent = token(s, '--accent', '#0369a1');
                const water = token(s, '--water', 'rgba(3,105,161,0.1)');
                const text = token(s, '--text', '#111827');
                const muted = token(s, '--text-3', '#6b7487');
                const line = token(s, '--line', 'rgba(17,24,39,0.09)');
                const surface = token(s, '--surface', '#ffffff');
                const mono = '"IBM Plex Mono", ui-monospace, monospace';
                if (chart) chart.destroy();
                chart = new Chart(ctx, {
                  type: 'scatter',
                  data: {
                    datasets: [
                      {
                        label: labels.today,
                        data: today,
                        backgroundColor: text,
                        borderColor: surface,
                        borderWidth: 3,
                        pointRadius: 7,
                        pointHoverRadius: 8,
                        order: 0,
                      },
                      {
                        label: labels.avg,
                        data: avg,
                        showLine: true,
                        borderColor: accent,
                        borderWidth: 2,
                        backgroundColor: water,
                        fill: 'start',
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: accent,
                        cubicInterpolationMode: 'monotone',
                        order: 1,
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    interaction: { mode: 'nearest', intersect: false },
                    scales: {
                      x: {
                        reverse: true,
                        title: { display: true, text: labels.x, color: muted, font: { size: 12 } },
                        grid: { color: line, drawTicks: false },
                        border: { display: false },
                        ticks: { color: muted, padding: 8, font: { family: mono, size: 11 } },
                      },
                      y: {
                        grace: '10%',
                        grid: { color: line, drawTicks: false },
                        border: { display: false },
                        ticks: {
                          color: muted,
                          padding: 8,
                          maxTicksLimit: 6,
                          font: { family: mono, size: 11 },
                          callback: function (v) { return v.toLocaleString(); },
                        },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: surface,
                        titleColor: muted,
                        bodyColor: text,
                        borderColor: line,
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                        displayColors: false,
                        bodyFont: { family: mono, size: 12 },
                        titleFont: { size: 12, weight: 'normal' },
                        callbacks: {
                          title: function (items) { return items[0] ? items[0].dataset.label : ''; },
                          label: function (item) {
                            return item.parsed.x + 'd · ' + item.parsed.y.toLocaleString();
                          },
                        },
                      },
                    },
                  },
                });
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', render);
              } else {
                render();
              }
              try {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
              } catch (e) {}
            })();
          `)}
        </script>
      ) : null}
    </>
  );
};
