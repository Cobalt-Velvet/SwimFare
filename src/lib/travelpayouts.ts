export type PriceObservation = {
  route: string;
  departure_date: string;
  observed_date: string;
  days_before: number;
  price: number;
  currency: string;
  airline: string | null;
};

type ApiOffer = {
  origin: string;
  destination: string;
  price: number;
  airline?: string;
  departure_at: string;
  return_at: string | null;
  transfers: number;
  duration: number;
};

type ApiResponse = {
  success: boolean;
  data: ApiOffer[];
  currency: string;
  error?: string;
};

const API_BASE = 'https://api.travelpayouts.com/aviasales/v3';

export type FetchPricesParams = {
  origin: string;
  destination: string;
  departureAt?: string;
  oneWay?: boolean;
  limit?: number;
  observedDate?: string;
};

export async function fetchCheapestPrices(
  token: string,
  params: FetchPricesParams,
): Promise<PriceObservation[]> {
  const { origin, destination, departureAt, oneWay = true, limit = 1, observedDate } = params;

  const url = new URL(`${API_BASE}/prices_for_dates`);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('currency', 'jpy');
  url.searchParams.set('sorting', 'price');
  url.searchParams.set('one_way', String(oneWay));
  url.searchParams.set('limit', String(limit));
  if (departureAt) url.searchParams.set('departure_at', departureAt);

  const res = await fetch(url.toString(), {
    headers: {
      'X-Access-Token': token,
      'Accept-Encoding': 'gzip, deflate',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Travelpayouts ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as ApiResponse;
  if (!body.success) {
    throw new Error(`Travelpayouts error: ${body.error ?? 'unknown'}`);
  }

  // 保存はJPYに統一する制約があるため、明示的に検証する。
  if (body.currency.toLowerCase() !== 'jpy') {
    throw new Error(`Expected JPY but got ${body.currency}`);
  }

  const observed = observedDate ?? todayUtc();
  const route = `${origin}-${destination}`;

  return body.data.map((offer) => {
    const departure_date = offer.departure_at.slice(0, 10);
    return {
      route,
      departure_date,
      observed_date: observed,
      days_before: daysBetween(observed, departure_date),
      price: Math.round(offer.price),
      currency: 'JPY',
      airline: offer.airline ?? null,
    };
  });
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const ms = Date.parse(to) - Date.parse(from);
  return Math.round(ms / 86_400_000);
}
