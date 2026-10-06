"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { createUser, findUserByEmail, getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { safeNextPath } from "@/lib/text";
import type { ActionState } from "@/lib/types";
import { invalid, validateAccount } from "@/lib/validators";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = validateAccount(formData, false);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const user = findUserByEmail(getDb(), parsed.email);
  if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
    return invalid("Неверная почта или пароль.", formData);
  }
  await startSession(user.id);
  redirect(safeNextPath(formData.get("next")));
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = validateAccount(formData, true);
  if (!parsed.ok) return invalid(parsed.error, formData);
  const created = createUser(getDb(), parsed);
  if (!created.ok) return { error: created.error };
  await startSession(created.id);
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
