"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/text";

export async function setThemeAction(formData: FormData) {
  const theme = formData.get("theme") === "dark" ? "dark" : "light";
  const jar = await cookies();
  jar.set("polka_theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const referer = (await headers()).get("referer");
  let next = "/";
  if (referer) {
    try {
      const url = new URL(referer);
      next = `${url.pathname}${url.search}`;
    } catch {
      next = "/";
    }
  }
  redirect(safeNextPath(next));
}
