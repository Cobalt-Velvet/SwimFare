import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import type { RoutePayload, HistoryPoint } from '../lib/store';
import { RouteSection } from './route-section';
import { STRINGS, type Locale } from '../i18n/strings';

type TodayPoint = { x: number; y: number; verdict: string };

export const RouteDetail: FC<{
  data: RoutePayload;
  history: HistoryPoint[];
  locale: Locale;
}> = ({ data, history, locale }) => {
  const t = STRINGS[locale];
  const today: TodayPoint[] = data.departures.map((d) => ({
    x: d.days_before,
    y: d.price,
    verdict: d.judgment.verdict,
  }));
  const avg = history.map((h) => ({ x: h.days_before, y: h.avg_price }));
  const chartReady = avg.length > 0 && today.length > 0;

  return (
    <>
      <p>
        <a href="/" class="back-link">
          {t.backLink}
        </a>
      </p>
      <RouteSection data={data} locale={locale} />

      <section class="chart-section">
        <h2>{t.chartTitle}</h2>
        <p class="help">{t.chartHelp}</p>
        {chartReady ? (
          <div class="chart-wrap">
            <canvas id="price-chart"></canvas>
          </div>
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
                y: ${JSON.stringify(t.chartYLabel)},
              };
              const color = {
                cheap: '#22c55e',
                normal: '#6b7280',
                expensive: '#ef4444',
                insufficient_data: '#3b82f6',
              };
              function render() {
                const ctx = document.getElementById('price-chart');
                if (!ctx || typeof Chart === 'undefined') return;
                const style = getComputedStyle(document.documentElement);
                const chartLine = style.getPropertyValue('--chart-line').trim() || '#94a3b8';
                const chartGrid = style.getPropertyValue('--chart-grid').trim() || 'rgba(15,23,42,0.08)';
                const chartText = style.getPropertyValue('--chart-text').trim() || '#475569';
                Chart.defaults.color = chartText;
                Chart.defaults.borderColor = chartGrid;
                new Chart(ctx, {
                  type: 'scatter',
                  data: {
                    datasets: [
                      {
                        label: labels.avg,
                        data: avg,
                        showLine: true,
                        borderColor: chartLine,
                        backgroundColor: chartLine,
                        pointRadius: 4,
                        tension: 0.2,
                      },
                      {
                        label: labels.today,
                        data: today.map(function (p) { return { x: p.x, y: p.y }; }),
                        backgroundColor: today.map(function (p) { return color[p.verdict] || '#0ea5e9'; }),
                        borderColor: today.map(function (p) { return color[p.verdict] || '#0ea5e9'; }),
                        pointRadius: 8,
                        pointHoverRadius: 10,
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: true, text: labels.x },
                        reverse: true,
                        grid: { color: chartGrid },
                      },
                      y: {
                        title: { display: true, text: labels.y },
                        ticks: {
                          callback: function (v) { return v.toLocaleString(); },
                        },
                        grid: { color: chartGrid },
                      },
                    },
                    plugins: { legend: { position: 'top' } },
                  },
                });
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', render);
              } else {
                render();
              }
            })();
          `)}
        </script>
      ) : null}
    </>
  );
};
