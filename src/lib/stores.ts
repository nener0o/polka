import { findSteamAppId, normalizeTitle } from "@/lib/covers";

export type StoreLinks = {
  steamUrl: string | null;
  epicUrl: string | null;
  xboxUrl: string | null;
  nintendoUrl: string | null;
  websiteUrl: string | null;
};

const EMPTY: StoreLinks = {
  steamUrl: null,
  epicUrl: null,
  xboxUrl: null,
  nintendoUrl: null,
  websiteUrl: null,
};

function steam(appId: number) {
  return `https://store.steampowered.com/app/${appId}`;
}


function epic(slug: string) {
  return `https://store.epicgames.com/p/${slug}`;
}

function xbox(slug: string, productId: string) {
  return `https://www.xbox.com/en-US/games/store/${slug}/${productId}`;
}

function nintendo(path: string) {
  return `https://www.nintendo.com${path}`;
}

const KNOWN: Record<string, StoreLinks> = {
  "hollow knight": {
    steamUrl: steam(367520),
    epicUrl: null,
    xboxUrl: xbox("hollow-knight-voidheart-edition", "9mw9469v91lm"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Hollow-Knight-1125772.html"),
    websiteUrl: "https://www.hollowknight.com/",
  },
  celeste: {
    steamUrl: steam(504230),
    epicUrl: epic("celeste"),
    xboxUrl: xbox("celeste", "bwmql2rpwbhb"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Celeste-1207064.html"),
    websiteUrl: "http://www.celestegame.com/",
  },
  hades: {
    steamUrl: steam(1145360),
    epicUrl: epic("hades"),
    xboxUrl: xbox("hades", "9p8dl6w0jbb8"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Hades-1821819.html"),
    websiteUrl: "https://www.supergiantgames.com/games/hades/",
  },
  "stardew valley": {
    steamUrl: steam(413150),
    epicUrl: null,
    xboxUrl: xbox("stardew-valley", "9mwr1nc6vq6l"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Stardew-Valley-1287587.html"),
    websiteUrl: "https://www.stardewvalley.net/",
  },
  "disco elysium": {
    steamUrl: steam(632470),
    epicUrl: epic("disco-elysium"),
    xboxUrl: xbox("disco-elysium-the-final-cut", "9ntrs771l8hl"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-games/Disco-Elysium-The-Final-Cut-2045652.html"),
    websiteUrl: "https://discoelysium.com/",
  },
  "outer wilds": {
    steamUrl: steam(753640),
    epicUrl: epic("outer-wilds"),
    xboxUrl: xbox("outer-wilds", "c596fkdkmqn7"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-games/Outer-Wilds-1923577.html"),
    websiteUrl: "https://www.mobiusdigitalgames.com/outer-wilds.html",
  },
  "portal 2": {
    steamUrl: steam(620),
      epicUrl: null,
    xboxUrl: null,
    nintendoUrl: null,
    websiteUrl: "http://www.thinkwithportals.com/",
  },
  "the witcher 3": {
    steamUrl: steam(292030),
    epicUrl: epic("the-witcher-3-wild-hunt"),
    xboxUrl: xbox("the-witcher-3-wild-hunt-remastered", "c261457lcnmj"),
    nintendoUrl: nintendo(
      "/en-gb/Games/Nintendo-Switch-games/The-Witcher-3-Wild-Hunt-Complete-Edition-1575086.html",
    ),
    websiteUrl: "https://www.thewitcher.com/witcher3",
  },
  "baldurs gate 3": {
    steamUrl: steam(1086940),
      epicUrl: null,
    xboxUrl: xbox("baldurs-gate-3", "9nd58lqtg09t"),
    nintendoUrl: null,
    websiteUrl: "https://baldursgate3.game/",
  },
  "elden ring": {
    steamUrl: steam(1245620),
    epicUrl: null,
    xboxUrl: null,
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-2-games/ELDEN-RING-Tarnished-Edition-2791969.html"),
    websiteUrl: "https://www.eldenring.com/",
  },
  undertale: {
    steamUrl: steam(391540),
    epicUrl: null,
    xboxUrl: xbox("undertale", "9n046hwgq4j2"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/UNDERTALE-1347694.html"),
    websiteUrl: "https://undertale.com/",
  },
  "slay the spire": {
    steamUrl: steam(646570),
      epicUrl: null,
    xboxUrl: xbox("slay-the-spire", "9mzqr8317s3b"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Slay-the-Spire-1423987.html"),
    websiteUrl: "https://www.megacrit.com/",
  },
  factorio: {
    steamUrl: steam(427520),
      epicUrl: null,
    xboxUrl: null,
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Factorio-2265209.html"),
    websiteUrl: "https://www.factorio.com/",
  },
  cuphead: {
    steamUrl: steam(268910),
    epicUrl: null,
    xboxUrl: xbox("cuphead", "9njrx71m5x9p"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/Cuphead-1532319.html"),
    websiteUrl: "http://www.cupheadgame.com/",
  },
  minecraft: {
    steamUrl: null,
    epicUrl: null,
    xboxUrl: xbox("minecraft-java-bedrock-edition-for-pc", "9nxp44l49shj"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-games/Minecraft-1386505.html"),
    websiteUrl: "https://www.minecraft.net/",
  },
  "half life 2": {
    steamUrl: steam(220),
      epicUrl: null,
    xboxUrl: null,
    nintendoUrl: null,
    websiteUrl: "http://www.half-life.com/halflife2",
  },
  "return of the obra dinn": {
    steamUrl: steam(653530),
    epicUrl: null,
    xboxUrl: null,
    nintendoUrl: nintendo(
      "/en-gb/Games/Nintendo-Switch-download-software/Return-of-the-Obra-Dinn-1633060.html",
    ),
    websiteUrl: "https://obradinn.com/",
  },
  "counter strike 2": {
    steamUrl: steam(730),
    epicUrl: null,
    xboxUrl: null,
    nintendoUrl: null,
    websiteUrl: "https://www.counter-strike.net/",
  },
  "dota 2": {
    steamUrl: steam(570),
    epicUrl: null,
    xboxUrl: null,
    nintendoUrl: null,
    websiteUrl: "https://www.dota2.com/",
  },
  "dave the diver": {
    steamUrl: steam(1868140),
    epicUrl: epic("dave-the-diver-ed092a"),
    xboxUrl: xbox("dave-the-diver", "9pc1zmd65l0t"),
    nintendoUrl: nintendo("/en-gb/Games/Nintendo-Switch-download-software/DAVE-THE-DIVER-2439847.html"),
    websiteUrl: "https://www.mintrocketgames.com/",
  },
};

const EDITION = new Set([
  "edition",
  "remaster",
  "remastered",
  "complete",
  "definitive",
  "goty",
  "game",
  "of",
  "the",
  "year",
  "cut",
  "final",
  "voidheart",
  "collection",
  "deluxe",
  "ps4",
  "ps5",
  "vita",
  "and",
  "base",
  "director",
  "directors",
  "enhanced",
  "ultimate",
  "gold",
  "premium",
  "pc",
]);

export function knownLinks(title: string): StoreLinks {
  return KNOWN[normalizeTitle(title)] ?? EMPTY;
}

export function isKnownTitle(title: string) {
  return Object.hasOwn(KNOWN, normalizeTitle(title));
}

export function hasLinks(links: StoreLinks) {
  return Boolean(
    links.steamUrl ||
      links.epicUrl ||
      links.xboxUrl ||
      links.nintendoUrl ||
      links.websiteUrl,
  );
}

/** 100 — то же имя, 90 — то же имя и пометка издания, иначе 0. */
export function linkScore(query: string, name: string) {
  const left = normalizeTitle(query);
  const right = normalizeTitle(name);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (!right.startsWith(`${left} `)) return 0;
  const rest = right.slice(left.length + 1).split(" ");
  return rest.every((word) => EDITION.has(word)) ? 90 : 0;
}

function cleanSite(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

const FETCH_HEADERS = {
  "user-agent": "Mozilla/5.0 (compatible; Polka/1.0)",
  accept: "application/json",
};

async function steamLinks(title: string) {
  const appId = await findSteamAppId(title);
  if (!appId) return { steamUrl: null, websiteUrl: null };
  const steamUrl = steam(appId);
  try {
    const url = new URL("https://store.steampowered.com/api/appdetails");
    url.searchParams.set("appids", String(appId));
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { steamUrl, websiteUrl: null };
    const data = (await response.json()) as Record<string, { data?: { website?: string } }>;
    return { steamUrl, websiteUrl: cleanSite(data[String(appId)]?.data?.website) };
  } catch {
    return { steamUrl, websiteUrl: null };
  }
}


type EpicElement = {
  title?: string;
  urlSlug?: string;
  productSlug?: string | null;
  catalogNs?: { mappings?: Array<{ pageSlug?: string; pageType?: string }> };
};

function epicSlug(item: EpicElement) {
  const mapped = item.catalogNs?.mappings?.find((entry) => entry.pageType === "productHome")?.pageSlug;
  const slug = mapped || item.productSlug || item.urlSlug;
  return slug ? epic(slug) : null;
}

async function epicLink(title: string) {
  try {
    const query = `query searchStoreQuery($keywords: String!, $count: Int, $country: String!) {
      Catalog { searchStore(keywords: $keywords, count: $count, country: $country) {
        elements {
          title
          urlSlug
          productSlug
          catalogNs { mappings(pageType: "productHome") { pageSlug pageType } }
        }
      } }
    }`;
    const response = await fetch("https://store.epicgames.com/graphql", {
      method: "POST",
      headers: { ...FETCH_HEADERS, "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { keywords: title, count: 8, country: "US" } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { data?: { Catalog?: { searchStore?: { elements?: EpicElement[] } } } };
    let best: { url: string; score: number } | null = null;
    for (const item of data.data?.Catalog?.searchStore?.elements ?? []) {
      if (!item.title) continue;
      const score = linkScore(title, item.title);
      const url = epicSlug(item);
      if (score >= 90 && url && (!best || score > best.score)) best = { url, score };
    }
    return best?.url ?? null;
  } catch {
    return null;
  }
}

type XboxProduct = { title?: string; productId?: string };

async function xboxLink(title: string) {
  try {
    const url = new URL("https://apps.microsoft.com/api/products/search");
    url.searchParams.set("query", title);
    url.searchParams.set("gl", "US");
    url.searchParams.set("hl", "en-us");
    url.searchParams.set("mediaType", "games");
    const response = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { productsList?: XboxProduct[] };
    let best: { url: string; score: number } | null = null;
    for (const item of data.productsList ?? []) {
      if (!item.title || !item.productId) continue;
      const score = linkScore(title, item.title);
      if (score < 90 || (best && score <= best.score)) continue;
      const slug = normalizeTitle(item.title).replace(/ /g, "-");
      best = { url: xbox(slug, item.productId), score };
    }
    return best?.url ?? null;
  } catch {
    return null;
  }
}

type NintendoDoc = { title?: string; url?: string };

async function nintendoLink(title: string) {
  try {
    const url = new URL("https://searching.nintendo-europe.com/en/select");
    url.searchParams.set("q", title);
    url.searchParams.set("fq", "type:GAME");
    url.searchParams.set("rows", "8");
    url.searchParams.set("wt", "json");
    const response = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { response?: { docs?: NintendoDoc[] } };
    let best: { url: string; score: number } | null = null;
    for (const item of data.response?.docs ?? []) {
      if (!item.title || !item.url || !item.url.startsWith("/")) continue;
      const score = linkScore(title, item.title);
      if (score >= 90 && (!best || score > best.score)) best = { url: nintendo(item.url), score };
    }
    return best?.url ?? null;
  } catch {
    return null;
  }
}

export async function resolveLinks(title: string): Promise<StoreLinks> {
  const ready = knownLinks(title);
  if (isKnownTitle(title)) return ready;
  try {
    const [steamSide, epicUrl, xboxUrl, nintendoUrl] = await Promise.all([
      steamLinks(title),
      epicLink(title),
      xboxLink(title),
      nintendoLink(title),
    ]);
    return {
      steamUrl: steamSide.steamUrl,
      epicUrl,
      xboxUrl,
      nintendoUrl,
      websiteUrl: steamSide.websiteUrl,
    };
  } catch {
    return EMPTY;
  }
}
