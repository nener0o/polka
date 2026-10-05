const RU: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const COVER_COLORS = [
  "#c2412d",
  "#1e6b45",
  "#1d4e89",
  "#8a5a12",
  "#6b3fa0",
  "#9a3e5d",
  "#0f6e6e",
  "#3f3a32",
];

export function slugify(input: string) {
  const mapped = [...input.trim().toLowerCase()]
    .map((char) => RU[char] ?? char)
    .join("");
  const slug = mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "game";
}

export function uniqueSlug(base: string, taken: (slug: string) => boolean) {
  if (!taken(base)) return base;
  for (let index = 2; index < 50; index += 1) {
    const next = `${base}-${index}`;
    if (!taken(next)) return next;
  }
  return `${base}-${Date.now()}`;
}

export function initials(title: string) {
  const words = title
    .replace(/[^A-Za-zА-Яа-яЁё0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function coverColor(title: string) {
  let index = 0;
  for (const char of title) index = (index + char.charCodeAt(0)) % COVER_COLORS.length;
  return COVER_COLORS[index];
}

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function gameCountLabel(count: number) {
  return `${count} ${plural(count, "игра", "игры", "игр")}`;
}

export function reviewCountLabel(count: number) {
  return `${count} ${plural(count, "отзыв", "отзыва", "отзывов")}`;
}

export function averageRating(values: number[]) {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function formatRating(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function clip(value: string, max: number) {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
