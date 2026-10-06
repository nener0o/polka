import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type SqlValue } from "node:sqlite";
import { knownCover } from "@/lib/covers";
import { isKnownTitle, knownLinks, type StoreLinks } from "@/lib/stores";
import { hashPassword } from "@/lib/password";
import { coverColor, slugify, uniqueSlug } from "@/lib/text";
import type {
  Game,
  GameSort,
  GameSource,
  MyReview,
  PublicUser,
  Review,
} from "@/lib/types";

const globalForDb = globalThis as unknown as {
  polkaDb?: DatabaseSync;
  coverVersion?: number;
  linksVersion?: number;
};
const COVER_VERSION = 1;

type GameInput = {
  title: string;
  description: string;
  genre: string;
  releaseYear: number | null;
  developer: string;
  coverUrl: string | null;
  source: GameSource;
  externalId?: string | null;
  steamUrl?: string | null;
  epicUrl?: string | null;
  xboxUrl?: string | null;
  nintendoUrl?: string | null;
  websiteUrl?: string | null;
};

const GAME_SELECT = `
  SELECT
    g.id, g.title, g.slug, g.description, g.genre, g.release_year, g.developer,
    g.cover_color, g.cover_url, g.steam_url, g.playstation_url, g.epic_url, g.xbox_url,
    g.nintendo_url, g.website_url,
    g.source, g.created_by, g.created_at,
    u.name AS created_by_name,
    COUNT(r.id) AS review_count,
    AVG(r.rating) AS avg_rating
  FROM games g
  LEFT JOIN reviews r ON r.game_id = g.id
  LEFT JOIN users u ON u.id = g.created_by
`;

export function openDatabase(filename: string) {
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys = ON");
  if (filename !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 3000");
  }
  return db;
}

export function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      genre TEXT NOT NULL,
      release_year INTEGER,
      developer TEXT NOT NULL DEFAULT '',
      cover_color TEXT NOT NULL,
      cover_url TEXT,
      external_id TEXT,
      source TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (game_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_game ON reviews(game_id);
    CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
  `);
  ensureColumn(db, "steam_url");
  ensureColumn(db, "playstation_url");
  ensureColumn(db, "epic_url");
  ensureColumn(db, "xbox_url");
  ensureColumn(db, "nintendo_url");
  ensureColumn(db, "website_url");
}

function ensureColumn(db: DatabaseSync, name: string) {
  const columns = db.prepare("PRAGMA table_info(games)").all();
  if (columns.some((column) => column.name === name)) return;
  db.exec(`ALTER TABLE games ADD COLUMN ${name} TEXT`);
}

export function getDb() {
  if (!globalForDb.polkaDb) {
    const directory = path.join(process.cwd(), "data");
    fs.mkdirSync(directory, { recursive: true });
    const db = openDatabase(path.join(directory, "polka.db"));
    migrate(db);
    seedIfEmpty(db);
    globalForDb.polkaDb = db;
  }
  if (globalForDb.coverVersion !== COVER_VERSION) {
    fillKnownCovers(globalForDb.polkaDb);
    globalForDb.coverVersion = COVER_VERSION;
  }
  ensureColumn(globalForDb.polkaDb, "steam_url");
  ensureColumn(globalForDb.polkaDb, "playstation_url");
  ensureColumn(globalForDb.polkaDb, "epic_url");
  ensureColumn(globalForDb.polkaDb, "xbox_url");
  ensureColumn(globalForDb.polkaDb, "nintendo_url");
  ensureColumn(globalForDb.polkaDb, "website_url");
  if (globalForDb.linksVersion !== 3) {
    fillKnownLinks(globalForDb.polkaDb);
    globalForDb.linksVersion = 3;
  }
  ensureExampleGames(globalForDb.polkaDb);
  return globalForDb.polkaDb;
}

function fillKnownLinks(db: DatabaseSync) {
  db.exec("UPDATE games SET playstation_url = NULL");
  const rows = db.prepare("SELECT id, title FROM games").all();
  const update = db.prepare(
    `UPDATE games
     SET steam_url = ?, playstation_url = ?, epic_url = ?, xbox_url = ?, nintendo_url = ?, website_url = ?
     WHERE id = ?`,
  );
  for (const row of rows) {
    const title = String(row.title);
    if (!isKnownTitle(title)) continue;
    const links = knownLinks(title);
    update.run(
      links.steamUrl,
      null,
      links.epicUrl,
      links.xboxUrl,
      links.nintendoUrl,
      links.websiteUrl,
      row.id,
    );
  }
}

function ensureExampleGames(db: DatabaseSync) {
  const demo = db.prepare("SELECT id FROM users WHERE email = ?").get("demo@polka.local");
  const mark = db.prepare("SELECT id FROM users WHERE email = ?").get("mark@polka.local");
  if (!demo || !mark) return;
  const insertGame = db.prepare(`
    INSERT INTO games (
      title, slug, description, genre, release_year, developer,
      cover_color, cover_url, steam_url, playstation_url, epic_url, xbox_url, nintendo_url, website_url,
      source, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReview = db.prepare(`
    INSERT INTO reviews (game_id, user_id, rating, title, body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const example of EXAMPLE_GAMES) {
    if (db.prepare("SELECT 1 AS ok FROM games WHERE slug = ?").get(example.slug)) continue;
    const userId = example.author === "demo" ? Number(demo.id) : Number(mark.id);
    const links = knownLinks(example.title);
    insertGame.run(
      example.title,
      example.slug,
      example.description,
      example.genre,
      example.releaseYear,
      example.developer,
      example.color,
      knownCover(example.title),
      links.steamUrl,
      null,
      links.epicUrl,
      links.xboxUrl,
      links.nintendoUrl,
      links.websiteUrl,
      "seed",
      userId,
      daysAgo(example.ago + 4),
    );
    const game = db.prepare("SELECT id FROM games WHERE slug = ?").get(example.slug);
    const at = daysAgo(example.ago);
    insertReview.run(Number(game?.id), userId, example.rating, example.reviewTitle, example.reviewBody, at, at);
  }
}

function fillKnownCovers(db: DatabaseSync) {
  const rows = db.prepare("SELECT id, title FROM games WHERE cover_url IS NULL OR cover_url = ''").all();
  const update = db.prepare("UPDATE games SET cover_url = ? WHERE id = ?");
  for (const row of rows) {
    const url = knownCover(String(row.title));
    if (url) update.run(url, row.id);
  }
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const EXAMPLE_GAMES = [
  {
    title: "Counter-Strike 2",
    slug: "counter-strike-2",
    description:
      "Пять на пять, где раунд решает позиция, а не сюжет. Карта читается по шагам: услышал шаг — уже информация.",
    genre: "Шутер",
    releaseYear: 2023,
    developer: "Valve",
    color: "#c45c26",
    author: "demo" as const,
    rating: 8,
    reviewTitle: "Раунд решает один пик",
    reviewBody:
      "Карта читается по шагам, а не по сюжету. Один удачный раунд не спасает половину, если команда уже расползлась.",
    ago: 3,
  },
  {
    title: "Dota 2",
    slug: "dota-2",
    description:
      "Одна партия на вечер. Герои, линии и предметы каждый матч складываются заново, поэтому двух одинаковых игр почти не бывает.",
    genre: "MOBA",
    releaseYear: 2013,
    developer: "Valve",
    color: "#8f2d2d",
    author: "mark" as const,
    rating: 7,
    reviewTitle: "Сорок минут на одну партию",
    reviewBody: "Каждый матч свой, но выйти из него посредине почти стыдно. Играю, когда есть целый вечер.",
    ago: 2,
  },
];

export function seedIfEmpty(db: DatabaseSync) {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (Number(existing?.count ?? 0) > 0) return;

  const demoHash = hashPassword("polka1234");
  const anyaHash = hashPassword("seed-anya-not-published");
  const markHash = hashPassword("seed-mark-not-published");

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
  );
  insertUser.run("Демо", "demo@polka.local", demoHash, daysAgo(40));
  insertUser.run("Аня Котова", "anya@polka.local", anyaHash, daysAgo(36));
  insertUser.run("Марк Левин", "mark@polka.local", markHash, daysAgo(30));

  const userId = (email: string) =>
    Number(db.prepare("SELECT id FROM users WHERE email = ?").get(email)?.id);

  const demo = userId("demo@polka.local");
  const anya = userId("anya@polka.local");
  const mark = userId("mark@polka.local");

  const games: Array<GameInput & { slug: string; color: string; by: number; at: string }> = [
    {
      title: "Hollow Knight",
      slug: "hollow-knight",
      description:
        "Подземное королевство без карты на старте. Бой короткий и честный, а интерес держится на том, что за следующей дверью снова темно.",
      genre: "Метроидвания",
      releaseYear: 2017,
      developer: "Team Cherry",
      coverUrl: null,
      source: "seed",
      color: "#1d4e89",
      by: demo,
      at: daysAgo(28),
    },
    {
      title: "Celeste",
      slug: "celeste",
      description:
        "Гора, которую поднимают маленькими попытками. Смерть здесь быстрая, поэтому злость не успевает накопиться.",
      genre: "Платформер",
      releaseYear: 2018,
      developer: "Extremely OK Games",
      coverUrl: null,
      source: "seed",
      color: "#c2412d",
      by: anya,
      at: daysAgo(26),
    },
    {
      title: "Hades",
      slug: "hades",
      description:
        "Забег из подземного мира, после которого с вами всё равно поговорят. Даже неудачный заход двигает разговоры и оружие.",
      genre: "Рогалик",
      releaseYear: 2020,
      developer: "Supergiant Games",
      coverUrl: null,
      source: "seed",
      color: "#8a5a12",
      by: demo,
      at: daysAgo(21),
    },
    {
      title: "Stardew Valley",
      slug: "stardew-valley",
      description:
        "Ферма, шахта и городок, где у каждого свой распорядок. Можно играть по часу вечером и не терять нитку.",
      genre: "Симулятор",
      releaseYear: 2016,
      developer: "ConcernedApe",
      coverUrl: null,
      source: "seed",
      color: "#1e6b45",
      by: anya,
      at: daysAgo(18),
    },
    {
      title: "Disco Elysium",
      slug: "disco-elysium",
      description:
        "Расследование, в котором главный противник — собственная голова. Боёв нет, зато каждая реплика может закрыть или открыть улику.",
      genre: "RPG",
      releaseYear: 2019,
      developer: "ZA/UM",
      coverUrl: null,
      source: "seed",
      color: "#6b3fa0",
      by: mark,
      at: daysAgo(16),
    },
    {
      title: "Outer Wilds",
      slug: "outer-wilds",
      description:
        "Маленькая солнечная система на двадцать две минуты. Знания остаются с вами после перезапуска, поэтому прогресс сидит в голове, а не в инвентаре.",
      genre: "Приключение",
      releaseYear: 2019,
      developer: "Mobius Digital",
      coverUrl: null,
      source: "seed",
      color: "#0f6e6e",
      by: mark,
      at: daysAgo(12),
    },
    {
      title: "Portal 2",
      slug: "portal-2",
      description:
        "Две портальные пушки и голос, который комментирует каждый провал. Головоломки читаются с первого взгляда и ломаются со второго.",
      genre: "Головоломка",
      releaseYear: 2011,
      developer: "Valve",
      coverUrl: null,
      source: "seed",
      color: "#3f3a32",
      by: demo,
      at: daysAgo(9),
    },
    {
      title: "The Witcher 3",
      slug: "the-witcher-3",
      description:
        "Дорога между заказами, где побочная история часто интереснее основной. Мир большой, но почти в каждой деревне есть конкретное дело.",
      genre: "RPG",
      releaseYear: 2015,
      developer: "CD PROJEKT RED",
      coverUrl: null,
      source: "seed",
      color: "#9a3e5d",
      by: demo,
      at: daysAgo(6),
    },
  ];

  for (const example of EXAMPLE_GAMES) {
    games.push({
      title: example.title,
      slug: example.slug,
      description: example.description,
      genre: example.genre,
      releaseYear: example.releaseYear,
      developer: example.developer,
      coverUrl: null,
      source: "seed",
      color: example.color,
      by: example.author === "demo" ? demo : mark,
      at: daysAgo(example.ago + 4),
    });
  }

  const insertGame = db.prepare(`
    INSERT INTO games (
      title, slug, description, genre, release_year, developer,
      cover_color, cover_url, steam_url, playstation_url, epic_url, xbox_url, nintendo_url, website_url,
      source, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const game of games) {
    const links = knownLinks(game.title);
    insertGame.run(
      game.title,
      game.slug,
      game.description,
      game.genre,
      game.releaseYear,
      game.developer,
      game.color,
      knownCover(game.title) ?? game.coverUrl,
      links.steamUrl,
      null,
      links.epicUrl,
      links.xboxUrl,
      links.nintendoUrl,
      links.websiteUrl,
      game.source,
      game.by,
      game.at,
    );
  }

  const gameId = (slug: string) =>
    Number(db.prepare("SELECT id FROM games WHERE slug = ?").get(slug)?.id);

  const insertReview = db.prepare(`
    INSERT INTO reviews (game_id, user_id, rating, title, body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const reviews: Array<[string, number, number, string, string, number]> = [
    [
      "hollow-knight",
      demo,
      9,
      "Темно и не обидно",
      "Заблудился на четыре вечера и почти не злился. Когда находишь скамью, выдыхаешь по-настоящему.",
      20,
    ],
    [
      "hollow-knight",
      anya,
      8,
      "Карта как награда",
      "Сначала бесит отсутствие карты, потом понимаешь, что в этом и смысл. Босс на арене — лучшая часть.",
      14,
    ],
    [
      "hollow-knight",
      mark,
      10,
      "Вернусь ещё",
      "Атмосфера густая, управление точное. Досмотрел не все секреты и специально оставил их на второй заход.",
      4,
    ],
    [
      "celeste",
      anya,
      10,
      "Злость не копится",
      "Умерла раз двести на одной стене и не бросила. Уровень учит одной идее и сразу её забирает.",
      11,
    ],
    [
      "celeste",
      mark,
      9,
      "Коротко и честно",
      "Можно пройти главу за вечер. Сложность высокая, но игра не прячет, почему ты упал.",
      3,
    ],
    [
      "hades",
      demo,
      8,
      "Даже смерть двигает сюжет",
      "После неудачного забега всё равно есть новый разговор. Из-за этого хочется нажать «ещё раз», а не закрыть игру.",
      8,
    ],
    [
      "hades",
      mark,
      7,
      "Красиво, но однообразно к десятому разу",
      "Бой отличный. К середине уже узнаёшь комнаты, зато диалоги всё ещё держат.",
      2,
    ],
    [
      "stardew-valley",
      anya,
      9,
      "Час вечером",
      "Полила грядки, спустилась в шахту, легла спать. Редко какая игра так спокойно заканчивает сессию.",
      7,
    ],
    [
      "disco-elysium",
      demo,
      10,
      "Разговор как бой",
      "Можно провалить проверку и получить более интересную сцену, чем при успехе. Такого почти нигде нет.",
      5,
    ],
    [
      "outer-wilds",
      mark,
      10,
      "Не читайте гайды",
      "Прогресс — это то, что вы поняли. Один раз подсмотрел ответ и пожалел: сцена перестала быть своей.",
      6,
    ],
    [
      "outer-wilds",
      anya,
      9,
      "Двадцать две минуты",
      "Петля сначала пугает, потом становится блокнотом. Играл с заметками на бумаге, так даже лучше.",
      1,
    ],
    [
      "portal-2",
      demo,
      9,
      "Смешно и ясно",
      "Почти каждая комната объясняется без текста. Голос за кадром спасает, когда застреваешь.",
      5,
    ],
    [
      "the-witcher-3",
      mark,
      8,
      "Побочки лучше дороги",
      "Главный сюжет можно отложить. В деревнях истории короче и часто злее, чем в замке.",
      2,
    ],
    [
      "the-witcher-3",
      demo,
      7,
      "Большой, местами рыхлый",
      "Бой так и не полюбил, но ехать по тракту вечером всё равно приятно. Оценку держит именно это.",
      1,
    ],
  ];

  for (const example of EXAMPLE_GAMES) {
    reviews.push([
      example.slug,
      example.author === "demo" ? demo : mark,
      example.rating,
      example.reviewTitle,
      example.reviewBody,
      example.ago,
    ]);
  }

  for (const [slug, user, rating, title, body, ago] of reviews) {
    const at = daysAgo(ago);
    insertReview.run(gameId(slug), user, rating, title, body, at, at);
  }
}

function mapGame(row: Record<string, SqlValue>): Game {
  const avg = row.avg_rating;
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description),
    genre: String(row.genre),
    releaseYear: row.release_year == null ? null : Number(row.release_year),
    developer: String(row.developer ?? ""),
    coverColor: String(row.cover_color),
    coverUrl: row.cover_url == null ? null : String(row.cover_url),
    steamUrl: row.steam_url == null ? null : String(row.steam_url),
    epicUrl: row.epic_url == null ? null : String(row.epic_url),
    xboxUrl: row.xbox_url == null ? null : String(row.xbox_url),
    nintendoUrl: row.nintendo_url == null ? null : String(row.nintendo_url),
    websiteUrl: row.website_url == null ? null : String(row.website_url),
    source: String(row.source) as GameSource,
    createdBy: row.created_by == null ? null : Number(row.created_by),
    createdByName: row.created_by_name == null ? null : String(row.created_by_name),
    createdAt: String(row.created_at),
    reviewCount: Number(row.review_count ?? 0),
    avgRating: avg == null ? null : Math.round(Number(avg) * 10) / 10,
  };
}

const SORTS: Record<GameSort, string> = {
  rating: "avg_rating IS NULL, avg_rating DESC, review_count DESC, g.title COLLATE NOCASE",
  reviews: "review_count DESC, avg_rating DESC, g.title COLLATE NOCASE",
  year: "g.release_year IS NULL, g.release_year DESC, g.title COLLATE NOCASE",
  title: "g.title COLLATE NOCASE ASC",
  new: "g.created_at DESC",
};

function likePattern(query: string) {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function listGames(
  db: DatabaseSync,
  filters: { q?: string; genre?: string; sort?: GameSort },
) {
  const q = (filters.q ?? "").trim();
  const genre = (filters.genre ?? "").trim();
  const sort = filters.sort && filters.sort in SORTS ? filters.sort : "rating";
  const pattern = likePattern(q);
  const rows = db
    .prepare(
      `${GAME_SELECT}
       WHERE (? = '' OR g.title LIKE ? ESCAPE '\\' OR g.developer LIKE ? ESCAPE '\\'
         OR g.genre LIKE ? ESCAPE '\\' OR g.description LIKE ? ESCAPE '\\')
         AND (? = '' OR g.genre = ?)
       GROUP BY g.id
       ORDER BY ${SORTS[sort]}
       LIMIT 100`,
    )
    .all(q, pattern, pattern, pattern, pattern, genre, genre);
  return rows.map(mapGame);
}

export function listGenres(db: DatabaseSync) {
  return db
    .prepare("SELECT DISTINCT genre FROM games ORDER BY genre COLLATE NOCASE")
    .all()
    .map((row) => String(row.genre));
}

export function getGameBySlug(db: DatabaseSync, slug: string) {
  const row = db.prepare(`${GAME_SELECT} WHERE g.slug = ? GROUP BY g.id`).get(slug);
  return row ? mapGame(row) : null;
}

export function findGameByTitle(db: DatabaseSync, title: string) {
  const needle = title.trim().toLowerCase();
  const row = db
    .prepare("SELECT slug, title FROM games")
    .all()
    .find((item) => String(item.title).trim().toLowerCase() === needle);
  if (!row) return null;
  return { slug: String(row.slug), title: String(row.title) };
}

function mapReview(row: Record<string, SqlValue>): Review {
  return {
    id: Number(row.id),
    gameId: Number(row.game_id),
    userId: Number(row.user_id),
    authorName: String(row.author_name),
    rating: Number(row.rating),
    title: String(row.title),
    body: String(row.body),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listReviews(db: DatabaseSync, gameId: number) {
  return db
    .prepare(
      `SELECT r.*, u.name AS author_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.game_id = ?
       ORDER BY r.created_at DESC`,
    )
    .all(gameId)
    .map(mapReview);
}

export function ratingHistogram(db: DatabaseSync, gameId: number) {
  const counts = Array.from({ length: 10 }, () => 0);
  const rows = db
    .prepare("SELECT rating, COUNT(*) AS count FROM reviews WHERE game_id = ? GROUP BY rating")
    .all(gameId);
  for (const row of rows) counts[Number(row.rating) - 1] = Number(row.count);
  return counts;
}

function linksFor(
  title: string,
  input: {
    steamUrl?: string | null;
    epicUrl?: string | null;
    xboxUrl?: string | null;
    nintendoUrl?: string | null;
    websiteUrl?: string | null;
  },
): StoreLinks {
  if (
    input.steamUrl !== undefined ||
    input.epicUrl !== undefined ||
    input.xboxUrl !== undefined ||
    input.nintendoUrl !== undefined ||
    input.websiteUrl !== undefined
  ) {
    return {
      steamUrl: input.steamUrl ?? null,
      epicUrl: input.epicUrl ?? null,
      xboxUrl: input.xboxUrl ?? null,
      nintendoUrl: input.nintendoUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
    };
  }
  return knownLinks(title);
}

export function createGame(db: DatabaseSync, input: GameInput, userId: number) {
  const title = input.title.trim();
  const existing = findGameByTitle(db, title);
  if (existing) {
    return {
      ok: false as const,
      error: `«${existing.title}» уже есть в каталоге.`,
      href: `/games/${existing.slug}`,
      hrefLabel: "Открыть карточку",
    };
  }

  const slug = uniqueSlug(slugify(title), (candidate) =>
    Boolean(db.prepare("SELECT 1 AS ok FROM games WHERE slug = ?").get(candidate)),
  );
  const links = linksFor(title, input);
  db.prepare(
    `INSERT INTO games (
      title, slug, description, genre, release_year, developer,
      cover_color, cover_url, steam_url, playstation_url, epic_url, xbox_url, nintendo_url, website_url,
      external_id, source, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    title,
    slug,
    input.description.trim(),
    input.genre.trim(),
    input.releaseYear,
    input.developer.trim(),
    coverColor(title),
    input.coverUrl,
    links.steamUrl,
    null,
    links.epicUrl,
    links.xboxUrl,
    links.nintendoUrl,
    links.websiteUrl,
    input.externalId ?? null,
    input.source,
    userId,
    new Date().toISOString(),
  );
  return { ok: true as const, slug };
}

export function updateGame(
  db: DatabaseSync,
  slug: string,
  userId: number,
  input: Omit<GameInput, "source" | "externalId">,
) {
  const game = getGameBySlug(db, slug);
  if (!game) return { ok: false as const, error: "Игра не найдена." };
  if (game.createdBy !== userId) {
    return { ok: false as const, error: "Карточку может менять только тот, кто её добавил." };
  }
  const title = input.title.trim();
  const clash = findGameByTitle(db, title);
  if (clash && clash.slug !== slug) {
    return {
      ok: false as const,
      error: `Название «${clash.title}» уже занято.`,
      href: `/games/${clash.slug}`,
      hrefLabel: "Открыть другую карточку",
    };
  }
  const links = linksFor(title, input);
  db.prepare(
    `UPDATE games
     SET title = ?, description = ?, genre = ?, release_year = ?, developer = ?,
         cover_url = COALESCE(?, cover_url),
         steam_url = ?,
         playstation_url = ?,
         epic_url = ?,
         xbox_url = ?,
         nintendo_url = ?,
         website_url = ?
     WHERE id = ?`,
  ).run(
    title,
    input.description.trim(),
    input.genre.trim(),
    input.releaseYear,
    input.developer.trim(),
    input.coverUrl ?? null,
    links.steamUrl,
    null,
    links.epicUrl,
    links.xboxUrl,
    links.nintendoUrl,
    links.websiteUrl,
    game.id,
  );
  return { ok: true as const, slug };
}

export function deleteGame(db: DatabaseSync, slug: string, userId: number) {
  const game = getGameBySlug(db, slug);
  if (!game || game.createdBy !== userId) return false;
  db.prepare("DELETE FROM games WHERE id = ?").run(game.id);
  return true;
}

export function createReview(
  db: DatabaseSync,
  gameId: number,
  userId: number,
  input: { rating: number; title: string; body: string },
) {
  const now = new Date().toISOString();
  try {
    db.prepare(
      `INSERT INTO reviews (game_id, user_id, rating, title, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(gameId, userId, input.rating, input.title.trim(), input.body.trim(), now, now);
    return null;
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      return "Вы уже оставили отзыв на эту игру. Его можно исправить ниже.";
    }
    throw error;
  }
}

export function updateReview(
  db: DatabaseSync,
  reviewId: number,
  userId: number,
  input: { rating: number; title: string; body: string },
) {
  const result = db
    .prepare(
      `UPDATE reviews
       SET rating = ?, title = ?, body = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(input.rating, input.title.trim(), input.body.trim(), new Date().toISOString(), reviewId, userId);
  return Number(result.changes) > 0;
}

export function deleteReview(db: DatabaseSync, reviewId: number, userId: number) {
  const result = db.prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?").run(reviewId, userId);
  return Number(result.changes) > 0;
}

export function listMyReviews(db: DatabaseSync, userId: number) {
  return db
    .prepare(
      `SELECT r.*, u.name AS author_name, g.title AS game_title, g.slug AS game_slug
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN games g ON g.id = r.game_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
    )
    .all(userId)
    .map((row) => {
      const review = mapReview(row);
      const mine: MyReview = {
        ...review,
        gameTitle: String(row.game_title),
        gameSlug: String(row.game_slug),
      };
      return mine;
    });
}

export function listMyGames(db: DatabaseSync, userId: number) {
  return db
    .prepare(`${GAME_SELECT} WHERE g.created_by = ? GROUP BY g.id ORDER BY g.created_at DESC`)
    .all(userId)
    .map(mapGame);
}

export function createUser(
  db: DatabaseSync,
  input: { name: string; email: string; password: string },
) {
  try {
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(input.name.trim(), input.email.trim().toLowerCase(), hashPassword(input.password), new Date().toISOString());
    return { ok: true as const, id: Number(result.lastInsertRowid) };
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      return { ok: false as const, error: "Такая почта уже зарегистрирована." };
    }
    throw error;
  }
}

export function findUserByEmail(db: DatabaseSync, email: string) {
  const row = db
    .prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());
  if (!row) return null;
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
  };
}

export function createSession(db: DatabaseSync, userId: number) {
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const now = new Date();
  const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  db.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(token, userId, now.toISOString(), expires.toISOString());
  return token;
}

export function findUserBySession(db: DatabaseSync, token: string): PublicUser | null {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token);
  if (!row) return null;
  if (String(row.expires_at) < new Date().toISOString()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return { id: Number(row.id), name: String(row.name), email: String(row.email) };
}

export function deleteSession(db: DatabaseSync, token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
