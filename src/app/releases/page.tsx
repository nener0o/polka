import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Cover } from "@/components/cover";
import { CurrencySwitch } from "@/components/currency-switch";
import { EmptyState } from "@/components/empty-state";
import { currencyById } from "@/lib/currencies";
import { loadReleases, type ReleaseGame } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Новинки",
};

export default async function ReleasesPage() {
  const currency = currencyById((await cookies()).get("polka_currency")?.value);
  const games = await loadReleases();
  const soon = games.filter((game) => game.comingSoon);
  const out = games.filter((game) => !game.comingSoon);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm tracking-wide text-muted-foreground uppercase">Новинки</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Что вышло и что выйдет</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Даты и описание взяты со страниц Steam. Тенге, доллары и евро — цена Steam.
            Рубли считаются из долларовой цены по курсу ЦБ: российский Steam отсюда не открывается.
          </p>
        </div>
        <CurrencySwitch current={currency} />
      </div>

      {games.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Steam сейчас не ответил"
            text="Список новинок читается с официальных страниц Steam. Обновите страницу через минуту."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <ReleaseGroup title="Скоро выйдут" games={soon} currency={currency} />
          <ReleaseGroup title="Уже вышли" games={out} currency={currency} />
        </div>
      )}
    </div>
  );
}

function ReleaseGroup({
  title,
  games,
  currency,
}: {
  title: string;
  games: ReleaseGame[];
  currency: ReturnType<typeof currencyById>;
}) {
  if (games.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {games.map((game) => {
          const price = game.prices[currency];
          return (
            <li key={game.appId}>
              <Link
                href={`/releases/${game.appId}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
              >
                <Cover title={game.name} color="#3f3a32" url={game.header || null} className="aspect-[460/215] w-full" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    {game.comingSoon ? "Скоро" : "Уже вышла"}
                    {game.releaseLabel ? ` · ${game.releaseLabel}` : ""}
                  </p>
                  <h3 className="font-serif text-xl leading-tight tracking-tight group-hover:underline">{game.name}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{game.description}</p>
                  <p className="mt-auto pt-2 text-sm font-medium">{price.text}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
