export const KOREA_AIRPORTS = ['ICN', 'PUS'] as const;
export const JAPAN_AIRPORTS = ['NRT', 'HND', 'KIX', 'FUK'] as const;

export const KOREA_TO_JAPAN = [
  'ICN-NRT',
  'ICN-KIX',
  'ICN-FUK',
  'PUS-NRT',
  'PUS-KIX',
  'PUS-FUK',
] as const;

export const JAPAN_TO_KOREA = [
  'NRT-ICN',
  'KIX-ICN',
  'FUK-ICN',
  'NRT-PUS',
  'KIX-PUS',
  'FUK-PUS',
] as const;

export const TRACKED_ROUTES = [...KOREA_TO_JAPAN, ...JAPAN_TO_KOREA] as const;
export type TrackedRoute = (typeof TRACKED_ROUTES)[number];

export type Direction = 'kr-to-jp' | 'jp-to-kr';

export function isTrackedRoute(route: string): route is TrackedRoute {
  return (TRACKED_ROUTES as readonly string[]).includes(route);
}

export function routeDirection(route: string): Direction {
  const origin = route.split('-')[0];
  return (KOREA_AIRPORTS as readonly string[]).includes(origin) ? 'kr-to-jp' : 'jp-to-kr';
}
