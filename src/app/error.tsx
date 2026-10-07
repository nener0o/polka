"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl tracking-tight">Страница не открылась</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Что-то пошло не так при загрузке. Нажмите кнопку ещё раз. Если не поможет, обновите вкладку.
      </p>
      <Button type="button" onClick={reset} className="mt-6 h-10">
        Попробовать снова
      </Button>
    </div>
  );
}
