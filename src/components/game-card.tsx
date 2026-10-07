import Link from "next/link";
import { Cover } from "@/components/cover";
import { RatingFigure } from "@/components/rating";
import { reviewCountLabel } from "@/lib/text";
import type { Game } from "@/lib/types";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
    >
      <Cover title={game.title} color={game.coverColor} url={game.coverUrl} className="aspect-[460/215] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {game.genre}
              {game.releaseYear ? ` · ${game.releaseYear}` : ""}
            </p>
            <h2 className="mt-1 font-serif text-xl leading-tight tracking-tight group-hover:underline">
              {game.title}
            </h2>
          </div>
          <RatingFigure value={game.avgRating} className="text-3xl" />
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{game.description}</p>
        <p className="mt-auto text-sm">{reviewCountLabel(game.reviewCount)}</p>
      </div>
    </Link>
  );
}
