import { knownCover } from "@/lib/covers";
import type { ExternalGame } from "@/lib/types";

const CATALOG: ExternalGame[] = [
  {
    externalId: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    description:
      "Большая партия, которую можно сохранить. Диалоги здесь меняют не только реплику, но и то, кто вообще доживёт до следующего акта.",
    genre: "RPG",
    releaseYear: 2023,
    developer: "Larian Studios",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "elden-ring",
    title: "Elden Ring",
    description:
      "Открытые земли, где подсказка чаще спрятана в окружении, чем в тексте. Умер — посмотрел, откуда прилетело, и пошёл снова.",
    genre: "RPG",
    releaseYear: 2022,
    developer: "FromSoftware",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "undertale",
    title: "Undertale",
    description:
      "Короткая история, в которой можно никого не бить. Юмор держится на мелочах, а повторное прохождение ощущается другой игрой.",
    genre: "RPG",
    releaseYear: 2015,
    developer: "Toby Fox",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "slay-the-spire",
    title: "Slay the Spire",
    description:
      "Колода, башня и один забег за вечер. Проигрыш здесь полезен: видно, какая карта была лишней.",
    genre: "Рогалик",
    releaseYear: 2019,
    developer: "Mega Crit",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "factorio",
    title: "Factorio",
    description:
      "Завод, который начинается с одной печи и незаметно занимает весь вечер. Удобно, если нравится наводить порядок в хаосе.",
    genre: "Стратегия",
    releaseYear: 2020,
    developer: "Wube Software",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "cuphead",
    title: "Cuphead",
    description:
      "Босс за боссом, почти без передышки. Рисунок как у старого мультфильма, а тайминг требует спокойных рук.",
    genre: "Платформер",
    releaseYear: 2017,
    developer: "Studio MDHR",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "minecraft",
    title: "Minecraft",
    description:
      "Кубы, из которых собирают и дом, и редстоун-схему. Хорошо заходит, когда хочется играть без чужого сценария.",
    genre: "Симулятор",
    releaseYear: 2011,
    developer: "Mojang",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "half-life-2",
    title: "Half-Life 2",
    description:
      "Дорога из города в город, где физика предметов — часть загадки. Стрельба есть, но запоминается то, как устроены уровни.",
    genre: "Шутер",
    releaseYear: 2004,
    developer: "Valve",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "obra-dinn",
    title: "Return of the Obra Dinn",
    description:
      "Страховой отчёт по пропавшему кораблю. Смотришь застывшую сцену и по деталям восстанавливаешь, кто есть кто.",
    genre: "Головоломка",
    releaseYear: 2018,
    developer: "Lucas Pope",
    coverUrl: null,
    source: "catalog",
  },
  {
    externalId: "dave-the-diver",
    title: "Dave the Diver",
    description:
      "Днём ныряешь за рыбой, вечером кормишь зал суши-бара. Лёгкий ритм, если хочется приключения без мрачного тона.",
    genre: "Приключение",
    releaseYear: 2023,
    developer: "MINTROCKET",
    coverUrl: null,
    source: "catalog",
  },
];

for (const game of CATALOG) {
  game.coverUrl = knownCover(game.title);
}

export function searchCatalog(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  return CATALOG.filter((game) =>
    [game.title, game.genre, game.developer].some((field) =>
      field.toLowerCase().includes(needle),
    ),
  );
}

export function findCatalogGame(externalId: string) {
  return CATALOG.find((game) => game.externalId === externalId) ?? null;
}
