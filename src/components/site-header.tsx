import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/actions/auth";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/lib/types";

export async function SiteHeader({ user }: { user: PublicUser | null }) {
  const dark = (await cookies()).get("polka_theme")?.value === "dark";
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-auto">
          <span className="block font-serif text-2xl leading-none tracking-tight">Полка</span>
          <span className="mt-1 block text-xs text-muted-foreground">отзывы на игры</span>
        </Link>
        <NavLinks />
        <ThemeToggle dark={dark} />
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/me" className="text-sm underline-offset-4 hover:underline">
              {user.name}
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="h-9 px-3">
                Выйти
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button nativeButton={false} render={<Link href="/login" />} variant="outline" className="h-9 px-3">
              Войти
            </Button>
            <Button nativeButton={false} render={<Link href="/register" />} className="h-9 px-3">
              Регистрация
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
