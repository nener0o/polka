import Link from "next/link";
import type { ActionState } from "@/lib/types";

export function FormError({ state }: { state: ActionState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {state.error}{" "}
      {state.href ? (
        <Link href={state.href} className="underline underline-offset-4">
          {state.hrefLabel ?? "Открыть"}
        </Link>
      ) : null}
    </p>
  );
}
