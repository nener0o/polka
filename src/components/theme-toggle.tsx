import { Moon, Sun } from "lucide-react";
import { setThemeAction } from "@/actions/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ dark }: { dark: boolean }) {
  return (
    <form action={setThemeAction}>
      <input type="hidden" name="theme" value={dark ? "light" : "dark"} />
      <Button
        type="submit"
        variant="outline"
        className="h-9 w-9 px-0"
        aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </form>
  );
}
