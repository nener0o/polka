import fs from "node:fs";
import path from "node:path";

const LOCAL: Record<string, string> = {
  "hollow knight": "/covers/hollow-knight.jpg",
  celeste: "/covers/celeste.jpg",
  hades: "/covers/hades.jpg",
  "stardew valley": "/covers/stardew-valley.jpg",
  "disco elysium": "/covers/disco-elysium.jpg",
  "outer wilds": "/covers/outer-wilds.jpg",
  "portal 2": "/covers/portal-2.jpg",
  "counter strike 2": "/covers/counter-strike-2.jpg",
  "dota 2": "/covers/dota-2.jpg",
  "the witcher 3": "/covers/the-witcher-3.jpg",
  "baldurs gate 3": "/covers/baldurs-gate-3.jpg",
  "elden ring": "/covers/elden-ring.jpg",
  undertale: "/covers/undertale.jpg",
  "slay the spire": "/covers/slay-the-spire.jpg",
  factorio: "/covers/factorio.jpg",
  cuphead: "/covers/cuphead.jpg",
  minecraft: "/covers/minecraft.jpg",
  "half life 2": "/covers/half-life-2.jpg",
  "return of the obra dinn": "/covers/obra-dinn.jpg",
  "dave the diver": "/covers/dave-the-diver.jpg",
};

const UA = "Mozilla/5.0 (compatible; Polka/1.0)";

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/['’":]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function knownCover(title: string) {
  return LOCAL[normalizeTitle(title)] ?? null;
}

/** 100 — то же название, 80 — то же название с подзаголовком, иначе 0. */
export function coverMatchScore(query: string, name: string) {
  const left = normalizeTitle(query);
  const right = normalizeTitle(name);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (right.startsWith(`${left} `) || left.startsWith(`${right} `)) return 80;
  return 0;
}

type SteamItem = { id?: number; name?: string; type?: string };

export async function findSteamAppId(title: string) {
  const hit = await searchSteam(title);
  return hit?.id ?? null;
}

async function searchSteam(title: string) {
  const url = new URL("https://store.steampowered.com/api/storesearch/");
  url.searchParams.set("term", title);
  url.searchParams.set("l", "russian");
  url.searchParams.set("cc", "us");
  const response = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { items?: SteamItem[] };
  let best: { id: number; score: number } | null = null;
  for (const item of data.items ?? []) {
    if (item.type !== "app" || !item.id || !item.name) continue;
    const score = coverMatchScore(title, item.name);
    if (score >= 80 && (!best || score > best.score)) best = { id: item.id, score };
  }
  return best;
}

async function saveRemoteImage(url: string, stem: string) {
  if (!url.startsWith("https://") || !/^[\w-]+$/.test(stem)) return null;
  const directory = path.join(process.cwd(), "public", "covers");
  const existing = ["jpg", "png", "webp"]
    .map((ext) => path.join(directory, `${stem}.${ext}`))
    .find((file) => fs.existsSync(file) && fs.statSync(file).size > 2000);
  if (existing) return `/covers/${path.basename(existing)}`;

  const response = await fetch(url, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!response.ok) return null;
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2000 || bytes.length > 2_000_000) return null;
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  fs.mkdirSync(directory, { recursive: true });
  const filename = `${stem}.${ext}`;
  fs.writeFileSync(path.join(directory, filename), bytes);
  return `/covers/${filename}`;
}

async function officialCover(appId: number) {
  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", String(appId));
  const response = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as Record<string, { data?: { website?: string } }>;
  const website = data[String(appId)]?.data?.website;
  if (!website || !website.startsWith("http")) return null;
  const page = await fetch(website, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!page.ok) return null;
  const html = await page.text();
  const match =
    html.match(/property=["']og:image["'][^>]*content=["'](https:[^"']+)["']/i) ??
    html.match(/content=["'](https:[^"']+)["'][^>]*property=["']og:image["']/i);
  const image = match?.[1];
  if (!image) return null;
  return saveRemoteImage(image, `site-${appId}`);
}

export async function resolveCoverUrl(title: string) {
  const ready = knownCover(title);
  if (ready) return ready;
  try {
    const hit = await searchSteam(title);
    if (!hit) return null;
    const header = `https://cdn.akamai.steamstatic.com/steam/apps/${hit.id}/header.jpg`;
    return (await saveRemoteImage(header, `steam-${hit.id}`)) ?? (await officialCover(hit.id));
  } catch {
    return null;
  }
}
