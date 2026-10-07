import { formatRating } from "@/lib/text";
import { cn } from "cn";

export function ratingTone(value: number | null) {
  if (value == null) return "text-muted-foreground";
  if (value >= 8) return "text-[#1e6b45] dark:text-[#8dcea8]";
  if (value >= 5) return "text-[#8a5a12] dark:text-[#e0b15a]";
  return "text-[#9f2d22] dark:text-[#f0a097]";
}

export function RatingFigure({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  return (
    <span className={cn("font-serif tabular-nums leading-none", ratingTone(value), className)}>
      {formatRating(value)}
    </span>
  );
}
