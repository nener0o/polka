import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GameFields } from "@/components/game-forms";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/data";
import { getGameBySlug } from "@/lib/db";

export const metadata: Metadata = {
  title: "Изменить карточку",
};

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/games/${slug}/edit`);
  const game = getGameBySlug(await database(), slug);
  if (!game) notFound();
  const owner = game.createdBy === user.id;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link href={`/games/${game.slug}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Назад к игре
      </Link>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Карточка</h1>
      {owner ? (
        <div className="mt-6">
          <GameFields mode="edit" game={game} />
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Эту карточку добавил {game.createdByName ?? "другой человек"}. Менять её может только он.
        </p>
      )}
    </div>
  );
}
