import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { RatingFigure } from "@/components/rating";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/data";
import { listMyGames, listMyReviews } from "@/lib/db";
import { formatDate } from "@/lib/text";

export const metadata: Metadata = {
  title: "Мои записи",
};

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const db = await database();
  const games = listMyGames(db, user.id);
  const reviews = listMyReviews(db, user.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <h1 className="mt-1 font-serif text-4xl tracking-tight">{user.name}</h1>

      <section className="mt-8">
        <h2 className="font-serif text-2xl tracking-tight">Игры, которые вы добавили</h2>
        {games.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Пока пусто"
              text="Карточки из стартового набора принадлежат другим людям. Свою можно добавить из списка или вручную."
              href="/games/new"
              action="Добавить игру"
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
            {games.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={`/games/${game.slug}`} className="font-medium underline-offset-4 hover:underline">
                  {game.title}
                </Link>
                <RatingFigure value={game.avgRating} className="text-2xl" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl tracking-tight">Ваши отзывы</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Отзывов нет. Откройте любую игру в каталоге и поставьте оценку.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/games/${review.gameSlug}`} className="font-medium underline-offset-4 hover:underline">
                      {review.gameTitle}
                    </Link>
                    <p className="mt-1 text-sm">{review.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  </div>
                  <RatingFigure value={review.rating} className="text-3xl" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
