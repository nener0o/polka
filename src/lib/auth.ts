import { cookies } from "next/headers";
import { createSession, deleteSession, findUserBySession, getDb } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

const COOKIE = "polka_session";
const MAX_AGE = 60 * 60 * 24 * 14;

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return findUserBySession(getDb(), token);
}

export async function startSession(userId: number) {
  const token = createSession(getDb(), userId);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) deleteSession(getDb(), token);
  jar.delete(COOKIE);
}
