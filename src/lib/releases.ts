import { currencyById, type CurrencyId } from "@/lib/currencies";
import { stripHtml } from "@/lib/text";

/** Игры со страницы Steam: часть уже вышла, часть ещё нет. Список на 12 октября 2026. */
export const RELEASE_APP_IDS = [
  3219030, 4231820, 4435490, 3259780, 2288340, 3010850, 4078430, 3669870,
] as const;

export type ReleasePrice = {
  text: string;
  note: string;
};

export type ReleaseGame = {
  appId: number;
  name: string;
  description: string;
  header: string;
  developers: string;
  publishers: string;
  comingSoon: boolean;
  releaseLabel: string;
  releaseTime: number | null;
  website: string | null;
  steamUrl: string;
  prices: Record<CurrencyId, ReleasePrice>;
};

const STEAM_CC: Record<Exclude<CurrencyId, "rub">, string> = {
  kzt: "kz",
  usd: "us",
  eur: "de",
};

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
  янв: 0,
  фев: 1,
  мар: 2,
  апр: 3,
  май: 4,
  июн: 5,
  июл: 6,
  авг: 7,
  сен: 8,
  окт: 9,
  ноя: 10,
  дек: 11,
};

const cache = globalThis as unknown as {
  polkaReleases?: { at: number; games: ReleaseGame[] };
  polkaUsdRate?: { at: number; rate: number; date: string };
};

const UA = { "user-agent": "Mozilla/5.0 (compatible; Polka/1.0)", accept: "application/json" };

export function rubFromUsdCents(cents: number, rubPerUsd: number) {
  if (!Number.isFinite(cents) || !Number.isFinite(rubPerUsd) || rubPerUsd <= 0) return null;
  return Math.round((cents / 100) * rubPerUsd);
}

export function parseSteamDate(value: string) {
  const year = value.match(/20\d{2}/)?.[0];
  const monthKey = Object.keys(MONTHS).find((key) => value.toLowerCase().includes(key));
  if (!year || !monthKey) return null;
  const day = Number(value.match(/\b(\d{1,2})\b/)?.[1] ?? "1");
  return Date.UTC(Number(year), MONTHS[monthKey], day);
}

function formatRelease(value: string) {
  const time = parseSteamDate(value);
  if (time == null) return { label: value, time: null };
  return {
    label: new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(time)),
    time,
  };
}

function formatRubles(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

type SteamPayload = {
  name?: string;
  type?: string;
  short_description?: string;
  header_image?: string;
  developers?: string[];
  publishers?: string[];
  website?: string | null;
  is_free?: boolean;
  release_date?: { coming_soon?: boolean; date?: string };
  price_overview?: { currency?: string; final?: number; final_formatted?: string };
};

async function steamApp(appId: number, cc: string) {
  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", String(appId));
  url.searchParams.set("cc", cc);
  url.searchParams.set("l", "russian");
  const response = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
  if (!response.ok) return null;
  const data = (await response.json()) as Record<string, { success?: boolean; data?: SteamPayload }>;
  const payload = data[String(appId)];
  if (!payload?.success || !payload.data || payload.data.type !== "game") return null;
  return payload.data;
}

async function usdRate() {
  const fresh = cache.polkaUsdRate;
  if (fresh && Date.now() - fresh.at < 6 * 60 * 60 * 1000) return fresh;
  try {
    const response = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Polka/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const xml = await response.text();
    const date = xml.match(/Date="([^"]+)"/)?.[1] ?? "";
    const block = xml.split("<Valute ").find((part) => part.includes("<CharCode>USD</CharCode>"));
    const nominal = Number(block?.match(/<Nominal>(\d+)<\/Nominal>/)?.[1] ?? "1");
    const value = Number((block?.match(/<Value>([^<]+)<\/Value>/)?.[1] ?? "").replace(",", "."));
    if (!nominal || !value) return null;
    const rate = { at: Date.now(), rate: value / nominal, date };
    cache.polkaUsdRate = rate;
    return rate;
  } catch {
    return null;
  }
}

function priceFor(
  currency: CurrencyId,
  game: SteamPayload,
  regional: SteamPayload | null,
  rate: { rate: number; date: string } | null,
): ReleasePrice {
  if (game.is_free) return { text: "Бесплатно", note: "На странице Steam игра бесплатная." };
  if (currency !== "rub") {
    const formatted = regional?.price_overview?.final_formatted;
    if (formatted) return { text: formatted, note: "Цена со страницы Steam." };
    return { text: "Цены пока нет", note: "Steam ещё не показал цену в этой валюте." };
  }
  if (!game.price_overview?.final || !rate) {
    return { text: "Цены пока нет", note: "В российском Steam страница не открылась, а долларовой цены для пересчёта нет." };
  }
  const rubles = rubFromUsdCents(game.price_overview.final, rate.rate);
  if (rubles == null) return { text: "Цены пока нет", note: "Курс ЦБ сейчас не прочитался." };
  return {
    text: formatRubles(rubles),
    note: `Долларовая цена Steam по курсу ЦБ на ${rate.date}. Российский Steam отсюда не открывается.`,
  };
}

async function loadOne(appId: number, rate: { rate: number; date: string } | null): Promise<ReleaseGame | null> {
  const [usd, kzt, eur] = await Promise.all([
    steamApp(appId, STEAM_CC.usd),
    steamApp(appId, STEAM_CC.kzt),
    steamApp(appId, STEAM_CC.eur),
  ]);
  if (!usd?.name) return null;
  const release = formatRelease(usd.release_date?.date ?? "");
  const website = typeof usd.website === "string" && /^https?:\/\//i.test(usd.website) ? usd.website : null;
  return {
    appId,
    name: usd.name,
    description: stripHtml(usd.short_description ?? ""),
    header: usd.header_image ?? "",
    developers: (usd.developers ?? []).join(", "),
    publishers: (usd.publishers ?? []).join(", "),
    comingSoon: Boolean(usd.release_date?.coming_soon),
    releaseLabel: release.label,
    releaseTime: release.time,
    website,
    steamUrl: `https://store.steampowered.com/app/${appId}`,
    prices: {
      rub: priceFor("rub", usd, null, rate),
      kzt: priceFor("kzt", usd, kzt, rate),
      usd: priceFor("usd", usd, usd, rate),
      eur: priceFor("eur", usd, eur, rate),
    },
  };
}

export async function loadReleases() {
  const fresh = cache.polkaReleases;
  if (fresh && Date.now() - fresh.at < 30 * 60 * 1000) return fresh.games;
  const rate = await usdRate();
  const games = (await Promise.all(RELEASE_APP_IDS.map((appId) => loadOne(appId, rate)))).filter(
    (game): game is ReleaseGame => game !== null,
  );
  games.sort((left, right) => {
    if (left.comingSoon !== right.comingSoon) return left.comingSoon ? -1 : 1;
    const leftTime = left.releaseTime ?? 0;
    const rightTime = right.releaseTime ?? 0;
    return left.comingSoon ? leftTime - rightTime : rightTime - leftTime;
  });
  if (games.length > 0) cache.polkaReleases = { at: Date.now(), games };
  return games;
}

export function releaseCurrency(value: string | undefined) {
  return currencyById(value);
}
