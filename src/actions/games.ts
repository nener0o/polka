"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveCoverUrl } from "@/lib/covers";
import { resolveLinks } from "@/lib/stores";
import { createGame, deleteGame, getDb, updateGame } from "@/lib/db";
import { loadExternalGame } from "@/lib/rawg";
import type { ActionState } from "@/lib/types";
import { fieldValues, invalid, validateGameFields } from "@/lib/validators";

function requireUser(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return { error: "Сначала войдите, чтобы менять каталог." };
  return null;
}

export async function importGameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const denied = requireUser(user);
  if (denied || !user) return denied;
  const source = String(formData.get("source") ?? "");
  const externalId = String(formData.get("externalId") ?? "");
  const loaded = await loadExternalGame(source, externalId);
  if (!loaded) {
    return invalid(
      "Не удалось получить данные игры. Попробуйте ещё раз или заполните карточку вручную.",
      formData,
    );
  }
  const links = await resolveLinks(loaded.title);
  const created = createGame(
    getDb(),
    {
      title: loaded.title,
      description: loaded.description,
      genre: loaded.genre,
      releaseYear: loaded.releaseYear,
      developer: loaded.developer,
      coverUrl: (await resolveCoverUrl(loaded.title)) ?? loaded.coverUrl,
      source: loaded.source,
      externalId: loaded.externalId,
      ...links,
    },
    user.id,
  );
  if (!created.ok) return created;
  revalidatePath("/");
  redirect(`/games/${created.slug}`);
}

export async function createGameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const denied = requireUser(user);
  if (denied || !user) return denied;
  const parsed = validateGameFields(formData);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const created = createGame(
    getDb(),
    {
      ...parsed,
      coverUrl: await resolveCoverUrl(parsed.title),
      source: "manual",
      ...(await resolveLinks(parsed.title)),
    },
    user.id,
  );
  if (!created.ok) return created;
  revalidatePath("/");
  redirect(`/games/${created.slug}`);
}

export async function updateGameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const denied = requireUser(user);
  if (denied || !user) return denied;
  const slug = String(formData.get("slug") ?? "");
  const parsed = validateGameFields(formData);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const updated = updateGame(getDb(), slug, user.id, {
    ...parsed,
    coverUrl: await resolveCoverUrl(parsed.title),
    ...(await resolveLinks(parsed.title)),
  });
  if (!updated.ok) {
    return {
      error: updated.error,
      href: "href" in updated ? updated.href : undefined,
      hrefLabel: "hrefLabel" in updated ? updated.hrefLabel : undefined,
      values: fieldValues(formData),
    };
  }
  revalidatePath("/");
  revalidatePath(`/games/${updated.slug}`);
  revalidatePath("/me");
  redirect(`/games/${updated.slug}`);
}

export async function deleteGameAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const slug = String(formData.get("slug") ?? "");
  const removed = deleteGame(getDb(), slug, user.id);
  if (!removed) redirect(`/games/${slug}`);
  revalidatePath("/");
  revalidatePath("/me");
  redirect("/");
}
