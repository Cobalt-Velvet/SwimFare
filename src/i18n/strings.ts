export type Locale = 'ja' | 'ko';
export type ThemePref = 'light' | 'dark' | null;

export type Strings = {
  catchphrase: string;
  lead: string;
  observed: string;
  daysBefore: (n: number) => string;
  departureSuffix: string;
  badge: {
    cheap: string;
    normal: string;
    expensive: string;
    collecting: (n: number, req: number) => string;
  };
  emptyRoute: string;
  backLink: string;
  chartTitle: string;
  chartHelp: string;
  chartLegendAvg: string;
  chartLegendToday: string;
  chartXLabel: string;
  chartYLabel: string;
  chartEmpty: string;
  adPlaceholder: string;
  footer: string;
  weekDay: readonly [string, string, string, string, string, string, string];
  airports: Record<string, { city: string; name: string }>;
  airlines: Record<string, string>;
  langLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeAuto: string;
  direction: {
    label: string;
    krToJp: string;
    jpToKr: string;
  };
};

export const STRINGS: Record<Locale, Strings> = {
  ja: {
    catchphrase: 'この値段だったら泳いで行くわ...',
    lead: '韓国〜日本の週末便について、「出発までの残り日数」を基準に過去価格と比べて当日が割安か割高かを判定します。',
    observed: '調査日',
    daysBefore: (n) => `残り ${n} 日`,
    departureSuffix: ' 発',
    badge: {
      cheap: '割安',
      normal: '通常',
      expensive: '割高',
      collecting: (n, req) => `データ収集中 (${n}/${req})`,
    },
    emptyRoute: 'この路線は Aviasales 上の検索データが少なく、収集中です。',
    backLink: '← 全路線',
    chartTitle: '残り日数別の価格',
    chartHelp:
      '過去30日に観測した「残り日数」ごとの平均価格（線）と、今日の各週末便の価格（点）。点が線より下にあれば割安、上なら割高の目安です。',
    chartLegendAvg: '過去30日の平均',
    chartLegendToday: '今日',
    chartXLabel: '出発までの残り日数',
    chartYLabel: '価格 (JPY)',
    chartEmpty: 'グラフ用のデータがまだ十分にありません。観測の蓄積をお待ちください。',
    adPlaceholder: '広告枠（AdSense 連携準備済み）',
    footer: 'データは Travelpayouts のキャッシュ由来で、実価格と一致しない場合があります。',
    weekDay: ['日', '月', '火', '水', '木', '金', '土'] as const,
    airports: {
      ICN: { city: 'ソウル', name: '仁川' },
      GMP: { city: 'ソウル', name: '金浦' },
      PUS: { city: '釜山', name: '金海' },
      NRT: { city: '東京', name: '成田' },
      HND: { city: '東京', name: '羽田' },
      KIX: { city: '大阪', name: '関西' },
      FUK: { city: '福岡', name: '福岡' },
    },
    airlines: {
      KE: '大韓航空',
      OZ: 'アシアナ航空',
      '7C': 'チェジュ航空',
      LJ: 'ジンエアー',
      TW: 'ティーウェイ航空',
      ZE: 'イースター航空',
      BX: 'エアプサン',
      RS: 'エアソウル',
      JL: '日本航空',
      NH: '全日空',
      MM: 'ピーチ・アビエーション',
      GK: 'ジェットスター・ジャパン',
      JJ: 'スプリング・ジャパン',
      ZG: 'ジップエア',
      RF: 'エアロK航空'
    },
    langLabel: '言語',
    themeLabel: 'テーマ',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    themeAuto: '自動',
    direction: {
      label: '方向',
      krToJp: '韓国 → 日本',
      jpToKr: '日本 → 韓国',
    },
  },
  ko: {
    catchphrase: '이 가격이면 수영해서 갈란다...',
    lead: '한국〜일본 주말 항공편을 "출발까지 남은 일수" 기준으로 과거 가격과 비교해 오늘 가격이 싼지 비싼지 판정합니다.',
    observed: '조사일',
    daysBefore: (n) => `남은 ${n}일`,
    departureSuffix: ' 출발',
    badge: {
      cheap: '저렴',
      normal: '평균',
      expensive: '비쌈',
      collecting: (n, req) => `데이터 수집 중 (${n}/${req})`,
    },
    emptyRoute: '이 노선은 Aviasales 검색 데이터가 적어 수집 중입니다.',
    backLink: '← 전체 노선',
    chartTitle: '남은 일수별 가격',
    chartHelp:
      '지난 30일간 관측한 "남은 일수"별 평균 가격(선)과 오늘의 각 주말 항공편 가격(점). 점이 선 아래면 저렴, 위면 비싼 편입니다.',
    chartLegendAvg: '지난 30일 평균',
    chartLegendToday: '오늘',
    chartXLabel: '출발까지 남은 일수',
    chartYLabel: '가격 (JPY)',
    chartEmpty: '그래프를 그리기에 충분한 데이터가 아직 없습니다. 관측 누적을 기다려 주세요.',
    adPlaceholder: '광고 영역 (AdSense 연동 준비됨)',
    footer: '데이터는 Travelpayouts 캐시 기반이라 실제 시장 가격과 다를 수 있습니다.',
    weekDay: ['일', '월', '화', '수', '목', '금', '토'] as const,
    airports: {
      ICN: { city: '서울', name: '인천' },
      GMP: { city: '서울', name: '김포' },
      PUS: { city: '부산', name: '김해' },
      NRT: { city: '도쿄', name: '나리타' },
      HND: { city: '도쿄', name: '하네다' },
      KIX: { city: '오사카', name: '간사이' },
      FUK: { city: '후쿠오카', name: '후쿠오카' },
    },
    airlines: {
      KE: '대한항공',
      OZ: '아시아나항공',
      '7C': '제주항공',
      LJ: '진에어',
      TW: '티웨이항공',
      ZE: '이스타항공',
      BX: '에어부산',
      RS: '에어서울',
      JL: '일본항공',
      NH: '전일본공수',
      MM: '피치항공',
      GK: '젯스타 재팬',
      JJ: '스프링재팬',
      ZG: '집에어',
      RF: '에어로케이항공'
    },
    langLabel: '언어',
    themeLabel: '테마',
    themeLight: '라이트',
    themeDark: '다크',
    themeAuto: '자동',
    direction: {
      label: '방향',
      krToJp: '한국 → 일본',
      jpToKr: '일본 → 한국',
    },
  },
};

export function airportLabel(iata: string, t: Strings): string {
  const a = t.airports[iata];
  return a ? `${a.city}(${iata})` : iata;
}

export function routeLabel(route: string, t: Strings): string {
  const [origin, destination] = route.split('-');
  return `${airportLabel(origin, t)} → ${airportLabel(destination, t)}`;
}

export function airlineLabel(iata: string | null, t: Strings): string {
  if (!iata) return '';
  const name = t.airlines[iata];
  if (!name) return iata;
  // ja は全角括弧、ko は半角括弧で見た目を整える。
  return name.match(/[぀-ヿ一-鿿]/) && !name.match(/[가-힣]/)
    ? `${iata}（${name}）`
    : `${iata} (${name})`;
}
