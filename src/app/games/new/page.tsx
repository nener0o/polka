import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { StoreLinks } from "@/components/store-links";
import { EmptyState } from "@/components/empty-state";
import { GameFields, ImportForm } from "@/components/game-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/data";
import { findGameByTitle } from "@/lib/db";
import { searchExternal } from "@/lib/rawg";
import { storeScores } from "@/lib/scores";
import { hasLinks, knownLinks, resolveLinks } from "@/lib/stores";
import { coverColor } from "@/lib/text";

export const metadata: Metadata = {
  title: "Добавить игру",
};

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = one((await searchParams).q);
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-sm tracking-wide text-muted-foreground uppercase">Каталог</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">Добавить игру</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        Сначала поищите готовую карточку. Если её нет, заполните поля сами: обложка
        подставится со страницы игры в Steam, а если игры там нет — с сайта студии.
      </p>

      {!user ? (
        <div className="mt-8">
          <EmptyState
            title="Сначала войдите"
            text="Добавлять игры и писать отзывы могут только вошедшие. Смотреть каталог можно без аккаунта."
            href="/login?next=/games/new"
            action="Войти"
          />
        </div>
      ) : (
        <>
          <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Например, Factorio или шутер"
              aria-label="Найти игру во внешнем списке"
              className="h-10"
            />
            <Button type="submit" className="h-10 px-4">
              Найти
            </Button>
          </form>
          <SearchResults query={q} />
          <h2 className="mt-10 font-serif text-2xl tracking-tight">Или заполните карточку сами</h2>
          <div className="mt-4">
            <GameFields mode="create" />
          </div>
        </>
      )}
    </div>
  );
}

async function linksForTitle(title: string) {
  const known = knownLinks(title);
  const links = hasLinks(known) ? known : await resolveLinks(title);
  return { links, scores: await storeScores(title, links) };
}

async function SearchResults({ query }: { query: string }) {
  if (!query) return null;
  const outcome = await searchExternal(query);
  const db = await database();
  const rows = await Promise.all(
    outcome.items.map(async (hit) => ({ hit, ...(await linksForTitle(hit.title)) })),
  );

  return (
    <section className="mt-6">
      {outcome.note ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm leading-6 text-secondary-foreground">
          {outcome.note}
        </p>
      ) : null}
      {outcome.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          В этом списке пусто. Ниже можно завести карточку вручную.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
          {rows.map(({ hit, links, scores }) => {
            const existing = findGameByTitle(db, hit.title);
            return (
              <li key={`${hit.source}-${hit.externalId}`} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <Cover
                  title={hit.title}
                  color={coverColor(hit.title)}
                  url={hit.coverUrl}
                  className="aspect-[460/215] w-full rounded-lg sm:w-36"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{hit.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {hit.genre}
                    {hit.releaseYear ? ` · ${hit.releaseYear}` : ""}
                    {hit.developer ? ` · ${hit.developer}` : ""}
                  </p>
                  <div className="mt-2">
                    <StoreLinks links={links} scores={scores} />
                  </div>
                </div>
                {existing ? (
                  <Button nativeButton={false} render={<Link href={`/games/${existing.slug}`} />} variant="outline" className="h-9">
                    Уже в каталоге
                  </Button>
                ) : (
                  <ImportForm hit={hit} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
