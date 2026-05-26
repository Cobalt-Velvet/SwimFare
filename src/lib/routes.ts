export const TRACKED_ROUTES = [
  'ICN-NRT',
  'ICN-KIX',
  'ICN-FUK',
  'PUS-NRT',
  'PUS-KIX',
  'PUS-FUK',
] as const;
export type TrackedRoute = (typeof TRACKED_ROUTES)[number];

export function isTrackedRoute(route: string): route is TrackedRoute {
  return (TRACKED_ROUTES as readonly string[]).includes(route);
}
