import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight">Такой страницы нет</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Адрес не совпал ни с одной игрой. Вернитесь в каталог и откройте карточку оттуда.
      </p>
      <Button nativeButton={false} render={<Link href="/" />} className="mt-6 h-10">
        В каталог
      </Button>
    </div>
  );
}
