import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
      {href && action ? (
        <Button
          nativeButton={false}
          render={<Link href={href} />}
          className="mt-4 h-10 px-3.5"
        >
          {action}
        </Button>
      ) : null}
    </div>
  );
}
