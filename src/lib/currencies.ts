export const CURRENCIES = [
  { id: "rub", label: "Рубли", short: "₽" },
  { id: "kzt", label: "Тенге", short: "₸" },
  { id: "usd", label: "Доллары", short: "$" },
  { id: "eur", label: "Евро", short: "€" },
] as const;

export type CurrencyId = (typeof CURRENCIES)[number]["id"];

export function currencyById(value: string | undefined): CurrencyId {
  return CURRENCIES.some((item) => item.id === value) ? (value as CurrencyId) : "rub";
}
