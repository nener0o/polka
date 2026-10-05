import type { ActionState } from "@/lib/types";

const YEAR_MIN = 1970;
const YEAR_MAX = new Date().getFullYear() + 1;

type Invalid = { ok: false; error: string };

export function fieldValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key !== "password") values[key] = value;
  }
  return values;
}

export function invalid(error: string, formData: FormData): ActionState {
  return { error, values: fieldValues(formData) };
}

export function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateReview(
  formData: FormData,
): Invalid | { ok: true; rating: number; title: string; body: string } {
  const rating = Number(readText(formData, "rating"));
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return { ok: false, error: "Поставьте оценку от 1 до 10." };
  }
  if (title.length < 3 || title.length > 80) {
    return { ok: false, error: "Заголовок отзыва: от 3 до 80 символов." };
  }
  if (body.length < 20 || body.length > 2000) {
    return { ok: false, error: "Текст отзыва: от 20 до 2000 символов." };
  }
  return { ok: true, rating, title, body };
}

export function validateGameFields(formData: FormData):
  | Invalid
  | {
      ok: true;
      title: string;
      genre: string;
      developer: string;
      description: string;
      releaseYear: number | null;
    } {
  const title = readText(formData, "title");
  const genre = readText(formData, "genre");
  const developer = readText(formData, "developer");
  const description = readText(formData, "description");
  const yearRaw = readText(formData, "releaseYear");
  if (title.length < 1 || title.length > 120) {
    return { ok: false, error: "Название: от 1 до 120 символов." };
  }
  if (genre.length < 2 || genre.length > 40) {
    return { ok: false, error: "Жанр: от 2 до 40 символов. Например, «Платформер»." };
  }
  if (developer.length > 80) {
    return { ok: false, error: "Студия: не длиннее 80 символов." };
  }
  if (description.length < 20 || description.length > 2000) {
    return { ok: false, error: "Описание: от 20 до 2000 символов. Пары предложений хватит." };
  }
  let releaseYear: number | null = null;
  if (yearRaw) {
    releaseYear = Number(yearRaw);
    if (!Number.isInteger(releaseYear) || releaseYear < YEAR_MIN || releaseYear > YEAR_MAX) {
      return { ok: false, error: `Год выпуска: число от ${YEAR_MIN} до ${YEAR_MAX}.` };
    }
  }
  return { ok: true, title, genre, developer, description, releaseYear };
}

export function validateAccount(
  formData: FormData,
  withName: boolean,
): Invalid | { ok: true; name: string; email: string; password: string } {
  const name = readText(formData, "name");
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");
  if (withName && (name.length < 2 || name.length > 40)) {
    return { ok: false, error: "Имя: от 2 до 40 символов." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Похоже, почта записана с ошибкой." };
  }
  if (password.length < 6 || password.length > 72) {
    return { ok: false, error: "Пароль: от 6 до 72 символов." };
  }
  return { ok: true, name, email, password };
}
