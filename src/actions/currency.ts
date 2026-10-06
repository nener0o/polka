"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { currencyById } from "@/lib/currencies";
import { safeNextPath } from "@/lib/text";

export async function setCurrencyAction(formData: FormData) {
  const currency = currencyById(String(formData.get("currency") ?? ""));
  const jar = await cookies();
  jar.set("polka_currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const referer = (await headers()).get("referer");
  let next = "/releases";
  if (referer) {
    try {
      const url = new URL(referer);
      next = `${url.pathname}${url.search}`;
    } catch {
      next = "/releases";
    }
  }
  redirect(safeNextPath(next));
}
