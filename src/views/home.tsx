import type { FC } from 'hono/jsx';
import type { RoutePayload } from '../lib/store';
import { RouteSection } from './route-section';
import { STRINGS, type Locale } from '../i18n/strings';

export const Home: FC<{ routes: RoutePayload[]; locale: Locale }> = ({ routes, locale }) => {
  const t = STRINGS[locale];
  return (
    <>
      <p class="lead">{t.lead}</p>
      {routes.map((r) => (
        <RouteSection data={r} locale={locale} linkTitle />
      ))}
    </>
  );
};
