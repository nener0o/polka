import { findCatalogGame, searchCatalog } from "@/lib/catalog";
import { clip, stripHtml } from "@/lib/text";
import type { ExternalGame, ExternalHit } from "@/lib/types";

const GENRES: Record<string, string> = {
  Action: "Экшен",
  Adventure: "Приключение",
  Indie: "Инди",
  RPG: "RPG",
  Strategy: "Стратегия",
  Shooter: "Шутер",
  Puzzle: "Головоломка",
  Simulation: "Симулятор",
  Platformer: "Платформер",
  Racing: "Гонки",
  Sports: "Спорт",
  Casual: "Казуальная",
  Fighting: "Файтинг",
  Arcade: "Аркада",
  "Massively Multiplayer": "MMO",
};

export type SearchOutcome = {
  source: "rawg" | "catalog";
  note: string | null;
  items: ExternalHit[];
};

type RawgListItem = {
  id?: number;
  name?: string;
  released?: string | null;
  background_image?: string | null;
  genres?: { name?: string }[];
};

type RawgDetail = RawgListItem & {
  description_raw?: string;
  description?: string;
  developers?: { name?: string }[];
};

function translateGenre(name: string | undefined) {
  if (!name) return "Разное";
  return GENRES[name] ?? name;
}

function yearFrom(released: string | null | undefined) {
  if (!released || released.length < 4) return null;
  const year = Number(released.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function toHit(item: RawgListItem): ExternalHit | null {
  if (!item.id || !item.name) return null;
  return {
    externalId: String(item.id),
    title: item.name,
    genre: translateGenre(item.genres?.[0]?.name),
    releaseYear: yearFrom(item.released),
    developer: "",
    coverUrl: item.background_image ?? null,
    source: "rawg",
  };
}

async function rawgGet<T>(path: string, params: Record<string, string>) {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;
  const url = new URL(`https://api.rawg.io/api/${path}`);
  url.searchParams.set("key", key);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`RAWG ${response.status}`);
  return (await response.json()) as T;
}

export async function searchExternal(query: string): Promise<SearchOutcome> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      source: process.env.RAWG_API_KEY ? "rawg" : "catalog",
      note: "Введите хотя бы две буквы.",
      items: [],
    };
  }

  if (!process.env.RAWG_API_KEY) {
    return {
      source: "catalog",
      note: "Показаны игры из списка Полки.",
      items: searchCatalog(trimmed),
    };
  }

  try {
    const data = await rawgGet<{ results?: RawgListItem[] }>("games", {
      search: trimmed,
      page_size: "8",
    });
    const items = (data?.results ?? [])
      .map(toHit)
      .filter((item): item is ExternalHit => item !== null);
    return { source: "rawg", note: null, items };
  } catch {
    return {
      source: "catalog",
      note: "Внешний каталог не ответил. Показан встроенный список.",
      items: searchCatalog(trimmed),
    };
  }
}

export async function loadExternalGame(
  source: string,
  externalId: string,
): Promise<ExternalGame | null> {
  if (source === "catalog") return findCatalogGame(externalId);
  if (source !== "rawg") return null;

  try {
    const data = await rawgGet<RawgDetail>(`games/${externalId}`, {});
    if (!data?.id || !data.name) return null;
    const description = clip(
      stripHtml(data.description_raw || data.description || ""),
      1200,
    );
    return {
      externalId: String(data.id),
      title: data.name,
      description:
        description || "В RAWG нет текста описания. Его можно дописать на странице игры.",
      genre: translateGenre(data.genres?.[0]?.name),
      releaseYear: yearFrom(data.released),
      developer: data.developers?.[0]?.name ?? "",
      coverUrl: data.background_image ?? null,
      source: "rawg",
    };
  } catch {
    return null;
  }
}
