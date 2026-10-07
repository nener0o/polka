import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { database } from "@/lib/data";
import { listGames, listGenres } from "@/lib/db";
import { gameCountLabel, reviewCountLabel } from "@/lib/text";
import type { GameSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Каталог",
};

const SORTS: { value: GameSort; label: string }[] = [
  { value: "rating", label: "Сначала высокая оценка" },
  { value: "reviews", label: "Сначала больше отзывов" },
  { value: "year", label: "Сначала новее по году" },
  { value: "title", label: "По названию" },
  { value: "new", label: "Недавно добавленные" },
];

const selectClass =
  "h-10 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asSort(value: string | undefined): GameSort {
  return SORTS.some((item) => item.value === value) ? (value as GameSort) : "rating";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; genre?: string | string[]; sort?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = one(params.q)?.trim() ?? "";
  const genre = one(params.genre)?.trim() ?? "";
  const sort = asSort(one(params.sort));
  const db = await database();
  const games = listGames(db, { q, genre, sort });
  const genres = listGenres(db);
  const filtered = Boolean(q || genre);
  const reviewTotal = games.reduce((sum, game) => sum + game.reviewCount, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-sm tracking-wide text-muted-foreground uppercase">Каталог</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
          Оценки ставят игроки
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Средняя на карточке — это среднее отзывов на Полке, а не цифра из магазина.
          Сейчас в выборке {gameCountLabel(games.length)} и {reviewCountLabel(reviewTotal)}.
        </p>
      </div>

      <form method="get" className="mt-8 grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:grid-cols-[1fr_11rem_14rem_auto]">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Название, студия или жанр"
          aria-label="Поиск"
          className="h-10"
        />
        <select name="genre" defaultValue={genre} aria-label="Жанр" className={selectClass}>
          <option value="">Все жанры</option>
          {genres.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Сортировка" className={selectClass}>
          {SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-10 px-4">
          Показать
        </Button>
      </form>

      {filtered ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Фильтр включён.{" "}
          <Link href="/" className="underline underline-offset-4">
            Сбросить
          </Link>
        </p>
      ) : null}

      {games.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Ничего не нашлось"
            text="Попробуйте другое слово или добавьте игру сами: из встроенного списка или вручную."
            href="/games/new"
            action="Добавить игру"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
