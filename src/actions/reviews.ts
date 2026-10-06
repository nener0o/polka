"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createReview,
  deleteReview,
  getDb,
  getGameBySlug,
  updateReview,
} from "@/lib/db";
import type { ActionState } from "@/lib/types";
import { invalid, validateReview } from "@/lib/validators";

export async function createReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) return invalid("Чтобы оставить отзыв, войдите.", formData);
  const game = getGameBySlug(getDb(), slug);
  if (!game) return invalid("Игра не найдена.", formData);
  const parsed = validateReview(formData);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const error = createReview(getDb(), game.id, user.id, parsed);
  if (error) return invalid(error, formData);
  revalidatePath(`/games/${slug}`);
  revalidatePath("/");
  revalidatePath("/me");
  redirect(`/games/${slug}`);
}

export async function updateReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) return invalid("Чтобы изменить отзыв, войдите.", formData);
  const reviewId = Number(formData.get("reviewId"));
  const parsed = validateReview(formData);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const saved = updateReview(getDb(), reviewId, user.id, parsed);
  if (!saved) return invalid("Этот отзыв нельзя изменить.", formData);
  revalidatePath(`/games/${slug}`);
  revalidatePath("/");
  revalidatePath("/me");
  redirect(`/games/${slug}`);
}

export async function deleteReviewAction(formData: FormData) {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) redirect(`/login?next=/games/${slug}`);
  const reviewId = Number(formData.get("reviewId"));
  deleteReview(getDb(), reviewId, user.id);
  revalidatePath(`/games/${slug}`);
  revalidatePath("/");
  revalidatePath("/me");
}
