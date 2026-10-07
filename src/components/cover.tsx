import { cn } from "cn";

export function Cover({
  title,
  color,
  url,
  className,
}: {
  title: string;
  color: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // Обложка может прийти со Steam или с сайта студии, домен заранее неизвестен.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cn("block object-cover", className)} />
    );
  }

  return (
    <div
      className={cn("block", className)}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={title}
    />
  );
}
