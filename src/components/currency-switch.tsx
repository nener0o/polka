import { setCurrencyAction } from "@/actions/currency";
import { CURRENCIES, type CurrencyId } from "@/lib/currencies";

export function CurrencySwitch({ current }: { current: CurrencyId }) {
  const active = CURRENCIES.find((item) => item.id === current) ?? CURRENCIES[0];
  return (
    <details className="relative">
      <summary className="flex h-10 list-none items-center gap-2 rounded-lg bg-secondary px-3 text-sm [&::-webkit-details-marker]:hidden">
        <span>
          {active.short} {active.label}
        </span>
        <span aria-hidden className="text-muted-foreground">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
        {CURRENCIES.map((item) => (
          <form key={item.id} action={setCurrencyAction}>
            <input type="hidden" name="currency" value={item.id} />
            <button
              type="submit"
              className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
              aria-current={item.id === current ? "true" : undefined}
            >
              {item.short} {item.label}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}
