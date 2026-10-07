"use client";

import { useActionState } from "react";
import { createGameAction, importGameAction, updateGameAction } from "@/actions/games";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExternalHit, Game } from "@/lib/types";

const fieldClass = "h-10";

export function ImportForm({ hit }: { hit: ExternalHit }) {
  const [state, action, pending] = useActionState(importGameAction, null);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="source" value={hit.source} />
      <input type="hidden" name="externalId" value={hit.externalId} />
      <FormError state={state} />
      <Button type="submit" disabled={pending} className="h-9">
        {pending ? "Добавляем…" : "Добавить в каталог"}
      </Button>
    </form>
  );
}

export function GameFields({
  game,
  mode,
}: {
  game?: Game;
  mode: "create" | "edit";
}) {
  const [state, action, pending] = useActionState(
    mode === "create" ? createGameAction : updateGameAction,
    null,
  );
  const values = state?.values;
  return (
    <form action={action} className="flex flex-col gap-4" key={values?.title ?? game?.slug ?? "new"}>
      <FormError state={state} />
      {game ? <input type="hidden" name="slug" value={game.slug} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Название</Label>
        <Input id="title" name="title" required defaultValue={values?.title ?? game?.title} className={fieldClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="genre">Жанр</Label>
          <Input id="genre" name="genre" required defaultValue={values?.genre ?? game?.genre} placeholder="Платформер" className={fieldClass} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="releaseYear">Год</Label>
          <Input
            id="releaseYear"
            name="releaseYear"
            inputMode="numeric"
            defaultValue={values?.releaseYear ?? game?.releaseYear ?? ""}
            placeholder="2018"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="developer">Студия</Label>
          <Input id="developer" name="developer" defaultValue={values?.developer ?? game?.developer} className={fieldClass} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Коротко, о чём игра</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={values?.description ?? game?.description}
          className="min-h-28"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-10 self-start px-4">
        {pending ? "Сохраняем…" : mode === "create" ? "Добавить игру" : "Сохранить"}
      </Button>
    </form>
  );
}
