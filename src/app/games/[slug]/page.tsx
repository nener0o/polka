import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteGameAction } from "@/actions/games";
import { deleteReviewAction } from "@/actions/reviews";
import { ConfirmForm } from "@/components/confirm-form";
import { Cover } from "@/components/cover";
import { RatingFigure } from "@/components/rating";
import { ReviewForm } from "@/components/review-form";
import { StoreLinks } from "@/components/store-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { storeScores } from "@/lib/scores";
import { database } from "@/lib/data";
import { getGameBySlug, listReviews, ratingHistogram } from "@/lib/db";
import { formatDate, reviewCountLabel } from "@/lib/text";
import type { GameSource } from "@/lib/types";

const SOURCE: Record<GameSource, string> = {
  seed: "Стартовый набор",
  manual: "Добавлено вручную",
  rawg: "Данные из RAWG",
  catalog: "Встроенный список",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(await database(), slug);
  if (!game) return { title: "Игра не найдена" };
  return { title: game.title, description: game.description };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await database();
  const game = getGameBySlug(db, slug);
  if (!game) notFound();

  const user = await getCurrentUser();
  const scores = await storeScores(game.title, {
    steamUrl: game.steamUrl,
    epicUrl: game.epicUrl,
    xboxUrl: game.xboxUrl,
    nintendoUrl: game.nintendoUrl,
    websiteUrl: game.websiteUrl,
  });
  const reviews = listReviews(db, game.id);
  const histogram = ratingHistogram(db, game.id);
  const mine = user ? reviews.find((review) => review.userId === user.id) : undefined;
  const owner = Boolean(user && game.createdBy === user.id);
  const peak = Math.max(...histogram, 1);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article>
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Все игры
        </Link>
        <Cover
          title={game.title}
          color={game.coverColor}
          url={game.coverUrl}
          className="mt-4 aspect-[460/215] w-full rounded-xl"
        />
        <div className="mt-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{game.genre}</Badge>
              <Badge variant="outline">{SOURCE[game.source]}</Badge>
            </div>
            <h1 className="mt-3 font-serif text-4xl tracking-tight">{game.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {game.developer || "Студия не указана"}
              {game.releaseYear ? ` · ${game.releaseYear}` : ""}
              {game.createdByName ? ` · добавил ${game.createdByName}` : ""}
            </p>
            <div className="mt-4">
              <StoreLinks
                scores={scores}
                links={{
                  steamUrl: game.steamUrl,
                  epicUrl: game.epicUrl,
                  xboxUrl: game.xboxUrl,
                  nintendoUrl: game.nintendoUrl,
                  websiteUrl: game.websiteUrl,
                }}
              />
            </div>
            <div className="mt-4 flex items-end gap-3">
              <RatingFigure value={game.avgRating} className="text-5xl" />
              <p className="pb-1 text-sm text-muted-foreground">
                {game.reviewCount === 0
                  ? "Оценок пока нет"
                  : `средняя по ${reviewCountLabel(game.reviewCount)}`}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-base leading-7">{game.description}</p>

        {owner ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href={`/games/${game.slug}/edit`} />} variant="outline" className="h-9">
              Изменить карточку
            </Button>
            <ConfirmForm action={deleteGameAction} message={`Удалить «${game.title}» вместе с отзывами?`}>
              <input type="hidden" name="slug" value={game.slug} />
              <Button type="submit" variant="destructive" className="h-9">
                Удалить
              </Button>
            </ConfirmForm>
          </div>
        ) : null}

        {game.reviewCount > 0 ? (
          <section className="mt-8">
            <h2 className="font-serif text-2xl tracking-tight">Как оценили</h2>
            <ul className="mt-4 space-y-1.5">
              {histogram
                .map((count, index) => ({ score: index + 1, count }))
                .reverse()
                .map((row) => (
                  <li key={row.score} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">{row.score}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(row.count / peak) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums">{row.count}</span>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="font-serif text-2xl tracking-tight">Отзывы</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Пока тишина. Если играли — оставьте первую оценку, от неё и посчитается средняя.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {reviews.map((review) => (
                <li key={review.id} className="py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-medium">{review.title}</h3>
                    <RatingFigure value={review.rating} className="text-2xl" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {review.authorName} · {formatDate(review.createdAt)}
                    {review.updatedAt !== review.createdAt ? " · исправлен" : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{review.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <aside className="h-fit rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:sticky lg:top-24">
        {user && mine ? (
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Ваш отзыв</h2>
            <div className="mt-4">
              <ReviewForm slug={game.slug} review={mine} />
            </div>
            <ConfirmForm action={deleteReviewAction} message="Удалить ваш отзыв?">
              <input type="hidden" name="slug" value={game.slug} />
              <input type="hidden" name="reviewId" value={mine.id} />
              <Button type="submit" variant="ghost" className="mt-2 h-9 px-2">
                Удалить отзыв
              </Button>
            </ConfirmForm>
          </div>
        ) : null}
        {user && !mine ? (
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Оставить отзыв</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Один отзыв на игру. Потом его можно исправить, вторую оценку поставить нельзя.
            </p>
            <div className="mt-4">
              <ReviewForm slug={game.slug} />
            </div>
          </div>
        ) : null}
        {!user ? (
          <div>
            <h2 className="font-serif text-2xl tracking-tight">Хотите оценить?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Отзыв привязан к человеку, поэтому сначала нужен вход. Читать каталог можно и без него.
            </p>
            <Button
              nativeButton={false}
              render={<Link href={`/login?next=/games/${game.slug}`} />}
              className="mt-4 h-10"
            >
              Войти и написать
            </Button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
