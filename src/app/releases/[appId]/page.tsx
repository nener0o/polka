import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { CurrencySwitch } from "@/components/currency-switch";
import { StoreLinks } from "@/components/store-links";
import { Badge } from "@/components/ui/badge";
import { currencyById } from "@/lib/currencies";
import { storeScores } from "@/lib/scores";
import { loadReleases, RELEASE_APP_IDS } from "@/lib/releases";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appId: string }>;
}): Promise<Metadata> {
  const { appId } = await params;
  const game = (await loadReleases()).find((item) => String(item.appId) === appId);
  if (!game) return { title: "Игра не найдена" };
  return { title: game.name, description: game.description };
}

export default async function ReleasePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const id = Number(appId);
  if (!RELEASE_APP_IDS.includes(id as (typeof RELEASE_APP_IDS)[number])) notFound();
  const game = (await loadReleases()).find((item) => item.appId === id);
  if (!game) notFound();
  const currency = currencyById((await cookies()).get("polka_currency")?.value);
  const price = game.prices[currency];
  const scores = await storeScores(game.name, {
    steamUrl: game.steamUrl,
    epicUrl: null,
    xboxUrl: null,
    nintendoUrl: null,
    websiteUrl: game.website,
  });
  const studio = [...new Set([game.developers, game.publishers].map((name) => name.trim()).filter(Boolean))].join(
    " · ",
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/releases" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Все новинки
      </Link>
      <Cover title={game.name} color="#3f3a32" url={game.header || null} className="mt-4 aspect-[460/215] w-full rounded-xl" />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{game.comingSoon ? "Скоро выйдет" : "Уже вышла"}</Badge>
        {game.releaseLabel ? <Badge variant="outline">{game.releaseLabel}</Badge> : null}
      </div>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">{game.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{studio || "Студия указана на странице Steam"}</p>
      <div className="mt-4">
        <StoreLinks
          scores={scores}
          links={{
            steamUrl: game.steamUrl,
            epicUrl: null,
            xboxUrl: null,
            nintendoUrl: null,
            websiteUrl: game.website,
          }}
        />
      </div>
      <p className="mt-6 max-w-2xl text-base leading-7">{game.description}</p>
      <section className="mt-8 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight">Стоимость</h2>
          <CurrencySwitch current={currency} />
        </div>
        <p className="mt-4 font-serif text-4xl tracking-tight">{price.text}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{price.note}</p>
      </section>
    </div>
  );
}
