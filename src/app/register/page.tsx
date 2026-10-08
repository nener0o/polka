import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/text";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  const nextValue = (await searchParams).next;
  const next = safeNextPath(Array.isArray(nextValue) ? nextValue[0] : (nextValue ?? null));
  if (user) redirect(next);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight">Регистрация</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Имя будет видно под отзывом. Пароль хранится не как текст, а как хеш.
      </p>
      <div className="mt-6">
        <RegisterForm next={next} />
      </div>
      <p className="mt-4 text-sm">
        Уже есть аккаунт?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline underline-offset-4">
          Войти
        </Link>
      </p>
    </div>
  );
}
