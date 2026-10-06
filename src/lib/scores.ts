import type { StoreLinks } from "@/lib/stores";

export type StoreScoreLabels = {
  steam: string | null;
  epic: string | null;
  xbox: string | null;
};

const memory = globalThis as unknown as { polkaScores?: Map<string, { at: number; value: string | null }> };

function bucket() {
  memory.polkaScores ??= new Map();
  return memory.polkaScores;
}

const UA = { "user-agent": "Mozilla/5.0 (compatible; Polka/1.0)", accept: "application/json" };

export function percentPositive(positive: number, total: number) {
  if (!Number.isFinite(positive) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((100 * positive) / total);
}

function oneDecimal(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 5) return null;
  return value.toFixed(1).replace(".", ",");
}

async function cached(key: string, load: () => Promise<string | null>) {
  const hit = bucket().get(key);
  if (hit && Date.now() - hit.at < 6 * 60 * 60 * 1000) return hit.value;
  try {
    const value = await load();
    bucket().set(key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

async function steamScore(url: string) {
  const appId = url.match(/\/app\/(\d+)/)?.[1];
  if (!appId) return null;
  return cached(`steam:${appId}`, async () => {
    const response = await fetch(
      `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`,
      { headers: UA, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      query_summary?: { total_positive?: number; total_reviews?: number };
    };
    const summary = data.query_summary;
    const percent = percentPositive(summary?.total_positive ?? 0, summary?.total_reviews ?? 0);
    return percent == null ? null : `${percent}%`;
  });
}

async function xboxScore(url: string) {
  const productId = url.match(/\/([a-z0-9]{10,})$/i)?.[1]?.toLowerCase();
  if (!productId) return null;
  return cached(`xbox:${productId}`, async () => {
    const endpoint = new URL(`https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/${productId}`);
    endpoint.searchParams.set("market", "US");
    endpoint.searchParams.set("locale", "en-us");
    endpoint.searchParams.set("deviceFamily", "Windows.Desktop");
    const response = await fetch(endpoint, { headers: UA, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { Payload?: { AverageRating?: number; RatingCount?: number } };
    if (!data.Payload?.RatingCount) return null;
    return oneDecimal(Number(data.Payload.AverageRating));
  });
}

async function epicScore(title: string, url: string) {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  if (!slug) return null;
  return cached(`epic:${slug}`, async () => {
    const query = `query searchStoreQuery($keywords: String!, $count: Int, $country: String!) {
      Catalog { searchStore(keywords: $keywords, count: $count, country: $country) {
        elements { namespace catalogNs { mappings(pageType: "productHome") { pageSlug } } }
      } }
    }`;
    const response = await fetch("https://store.epicgames.com/graphql", {
      method: "POST",
      headers: { ...UA, "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { keywords: title, count: 8, country: "US" } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      data?: {
        Catalog?: {
          searchStore?: {
            elements?: Array<{ namespace?: string; catalogNs?: { mappings?: Array<{ pageSlug?: string }> } }>;
          };
        };
      };
    };
    const element = data.data?.Catalog?.searchStore?.elements?.find((item) =>
      item.catalogNs?.mappings?.some((mapping) => mapping.pageSlug === slug),
    );
    if (!element?.namespace) return null;
    const ratingQuery = `query getRating($sandboxId: String!, $locale: String!) {
      RatingsPolls { getProductResult(sandboxId: $sandboxId, locale: $locale) { averageRating } }
    }`;
    const ratingResponse = await fetch("https://store.epicgames.com/graphql", {
      method: "POST",
      headers: { ...UA, "content-type": "application/json" },
      body: JSON.stringify({
        query: ratingQuery,
        variables: { sandboxId: element.namespace, locale: "en-US" },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!ratingResponse.ok) return null;
    const ratingData = (await ratingResponse.json()) as {
      data?: { RatingsPolls?: { getProductResult?: { averageRating?: number } } };
    };
    return oneDecimal(Number(ratingData.data?.RatingsPolls?.getProductResult?.averageRating));
  });
}

export async function storeScores(title: string, links: StoreLinks): Promise<StoreScoreLabels> {
  const [steam, epic, xbox] = await Promise.all([
    links.steamUrl ? steamScore(links.steamUrl) : Promise.resolve(null),
    links.epicUrl ? epicScore(title, links.epicUrl) : Promise.resolve(null),
    links.xboxUrl ? xboxScore(links.xboxUrl) : Promise.resolve(null),
  ]);
  return { steam, epic, xbox };
}
