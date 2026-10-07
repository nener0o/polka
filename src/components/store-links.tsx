import { Globe } from "lucide-react";
import type { StoreScoreLabels } from "@/lib/scores";
import type { StoreLinks } from "@/lib/stores";

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-9.9 8.6l5.4 2.2a2.7 2.7 0 0 1 1.5-.4l2.3-3.4A3.7 3.7 0 1 1 15.6 13l-3.2 2.3a2.7 2.7 0 0 1 0 .6 2.7 2.7 0 1 1-5.2-1.1L2.2 13A10 10 0 1 0 12 2Zm-1.6 13.2 1.7-1.2a2.7 2.7 0 0 0 1.5.4l2.4-1.7a3.7 3.7 0 0 0 1.9.5 3.7 3.7 0 1 0-3.7-3.8L12 11.6a2.7 2.7 0 0 0-1.6 3.6Z"
      />
    </svg>
  );
}

function EpicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.2a8.8 8.8 0 1 0 7.4 13.4l-2.1-1.5A6.4 6.4 0 1 1 12 5.6c1.5 0 2.9.5 4 1.4l1.6-2A8.8 8.8 0 0 0 12 3.2Z"
      />
    </svg>
  );
}

function XboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function NintendoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <rect x="3.2" y="6" width="7.2" height="12" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.6" y="6" width="7.2" height="12" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const itemClass =
  "inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-3 text-sm text-secondary-foreground ring-1 ring-foreground/10 transition-colors hover:bg-accent";

function withScore(name: string, score?: string | null) {
  return score ? `${name} ${score}` : name;
}

export function StoreLinks({ links, scores }: { links: StoreLinks; scores?: StoreScoreLabels }) {
  const items = [
    links.steamUrl
      ? {
          href: links.steamUrl,
          label: withScore("Steam", scores?.steam),
          hint: scores?.steam ? `Оценка игроков в Steam: ${scores.steam} положительных` : "Страница в Steam",
          icon: <SteamIcon />,
        }
      : null,
    links.epicUrl
      ? {
          href: links.epicUrl,
          label: withScore("Epic", scores?.epic),
          hint: scores?.epic ? `Оценка игроков в Epic Games: ${scores.epic} из 5` : "Страница в Epic Games",
          icon: <EpicIcon />,
        }
      : null,
    links.xboxUrl
      ? {
          href: links.xboxUrl,
          label: withScore("Xbox", scores?.xbox),
          hint: scores?.xbox ? `Оценка игроков в Xbox: ${scores.xbox} из 5` : "Страница в Xbox",
          icon: <XboxIcon />,
        }
      : null,
    links.nintendoUrl
      ? {
          href: links.nintendoUrl,
          label: "Nintendo",
          hint: "Страница в Nintendo",
          icon: <NintendoIcon />,
        }
      : null,
    links.websiteUrl
      ? {
          href: links.websiteUrl,
          label: "Сайт",
          hint: "Официальный сайт игры",
          icon: <Globe className="size-4" />,
        }
      : null,
  ].filter((item) => item !== null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.hint}
          className={itemClass}
        >
          {item.icon}
          {item.label}
        </a>
      ))}
    </div>
  );
}
