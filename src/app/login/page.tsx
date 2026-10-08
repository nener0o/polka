import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/text";

export const metadata: Metadata = {
  title: "Вход",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  const nextValue = (await searchParams).next;
  const next = safeNextPath(Array.isArray(nextValue) ? nextValue[0] : (nextValue ?? null));
  if (user) redirect(next);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">Вход</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          После входа можно добавить игру и оставить один отзыв на каждую.
        </p>
        <div className="mt-6 max-w-md">
          <LoginForm next={next} />
        </div>
        <p className="mt-4 text-sm">
          Нет аккаунта?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline underline-offset-4">
            Регистрация
          </Link>
        </p>
      </div>
      <aside className="h-fit rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-serif text-2xl tracking-tight">Демо-вход</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Учётка уже создана вместе с базой. У неё есть свои игры и отзывы, их можно менять.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Почта</dt>
            <dd>demo@polka.local</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Пароль</dt>
            <dd>polka1234</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
