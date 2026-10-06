import { connection } from "next/server";
import { getDb } from "@/lib/db";

export async function database() {
  await connection();
  return getDb();
}
