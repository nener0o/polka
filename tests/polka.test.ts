import assert from "node:assert/strict";
import test from "node:test";
import { searchCatalog } from "../src/lib/catalog";
import { coverMatchScore, knownCover } from "../src/lib/covers";
import { percentPositive } from "../src/lib/scores";
import { rubFromUsdCents } from "../src/lib/releases";
import { knownLinks, linkScore } from "../src/lib/stores";
import {
  createGame,
  createReview,
  deleteGame,
  findUserByEmail,
  getGameBySlug,
  listGames,
  migrate,
  openDatabase,
  seedIfEmpty,
} from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/password";
import {
  averageRating,
  gameCountLabel,
  initials,
  reviewCountLabel,
  slugify,
} from "../src/lib/text";

function freshDb() {
  const db = openDatabase(":memory:");
  migrate(db);
  seedIfEmpty(db);
  return db;
}

test("slug, initials and plural labels", () => {
  assert.equal(slugify("Hollow Knight"), "hollow-knight");
  assert.equal(slugify("Ведьмак"), "vedmak");
  assert.equal(initials("The Witcher 3"), "TW");
  assert.equal(initials("Hades"), "HA");
  assert.equal(gameCountLabel(1), "1 игра");
  assert.equal(gameCountLabel(2), "2 игры");
  assert.equal(gameCountLabel(5), "5 игр");
  assert.equal(gameCountLabel(21), "21 игра");
  assert.equal(reviewCountLabel(11), "11 отзывов");
  assert.equal(reviewCountLabel(3), "3 отзыва");
});

test("password hash does not store the password itself", () => {
  const stored = hashPassword("polka1234");
  assert.equal(stored.includes("polka1234"), false);
  assert.equal(verifyPassword("polka1234", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
});

test("average rating rounds to one decimal", () => {
  assert.equal(averageRating([]), null);
  assert.equal(averageRating([9, 8, 10]), 9);
  assert.equal(averageRating([7, 8]), 7.5);
});

test("known covers and title matching", () => {
  assert.equal(knownCover("Hollow Knight"), "/covers/hollow-knight.jpg");
  assert.equal(knownCover("Baldur's Gate 3"), "/covers/baldurs-gate-3.jpg");
  assert.equal(knownCover("Совсем другая игра"), null);
  assert.equal(coverMatchScore("Hollow Knight", "Hollow Knight"), 100);
  assert.equal(coverMatchScore("Hollow Knight", "Hollow Knight: Silksong"), 80);
  assert.equal(coverMatchScore("Cup", "Cuphead"), 0);
  assert.equal(linkScore("Celeste", "Celeste"), 100);
  assert.equal(linkScore("Hollow Knight", "Hollow Knight: Silksong"), 0);
  assert.equal(linkScore("Disco Elysium", "Disco Elysium - The Final Cut"), 90);
  assert.equal(knownLinks("Celeste").steamUrl?.includes("steampowered.com"), true);
  assert.equal(JSON.stringify(knownLinks("Celeste")).includes("playstation"), false);
  assert.equal(knownLinks("Celeste").epicUrl?.includes("epicgames.com"), true);
  assert.equal(knownLinks("Celeste").xboxUrl?.includes("xbox.com"), true);
  assert.equal(knownLinks("Celeste").nintendoUrl?.includes("nintendo.com"), true);
  assert.equal(knownLinks("Minecraft").steamUrl, null);
  assert.equal(knownLinks("Minecraft").epicUrl, null);
  assert.equal(knownLinks("Counter-Strike 2").steamUrl?.includes("/app/730"), true);
  assert.equal(knownLinks("Dota 2").steamUrl?.includes("/app/570"), true);
  assert.equal(knownLinks("Portal 2").epicUrl, null);
  assert.equal(knownLinks("Portal 2").xboxUrl, null);
  assert.equal(knownLinks("Portal 2").nintendoUrl, null);
  assert.equal(knownLinks("Half-Life 2").nintendoUrl, null);
  assert.equal(knownLinks("Hollow Knight").epicUrl, null);
  assert.equal(knownLinks("Hollow Knight").xboxUrl?.includes("9mw9469v91lm"), true);
  assert.equal(knownLinks("Hollow Knight").xboxUrl?.includes("silksong"), false);
  assert.equal(linkScore("Undertale", "Undertale (PC)"), 90);
  assert.equal(linkScore("Hades", "Hades II"), 0);
  assert.equal(linkScore("Baldur's Gate 3", "Baldur's Gate II: Enhanced Edition"), 0);
  const hades = getGameBySlug(freshDb(), "hades");
  assert.equal(hades?.epicUrl?.includes("epicgames.com/p/hades"), true);
  assert.equal(hades?.nintendoUrl?.includes("nintendo.com"), true);
  const portal = getGameBySlug(freshDb(), "portal-2");
  assert.equal(portal?.epicUrl, null);
  assert.equal(portal?.xboxUrl, null);
});

test("store review percent rounds from positive reviews", () => {
  assert.equal(percentPositive(303635, 309856), 98);
  assert.equal(percentPositive(1, 2), 50);
  assert.equal(percentPositive(0, 0), null);
});

test("ruble price follows the central bank rate", () => {
  assert.equal(rubFromUsdCents(6999, 100), 6999);
  assert.equal(rubFromUsdCents(4999, 90), 4499);
  assert.equal(rubFromUsdCents(1999, 0), null);
});

test("catalog search stays inside the built-in list", () => {
  assert.equal(searchCatalog("a").length, 0);
  assert.equal(searchCatalog("baldur")[0]?.title, "Baldur's Gate 3");
  assert.equal(searchCatalog("шутер")[0]?.title, "Half-Life 2");
});

test("seed, filters, one review per person and owner delete", () => {
  const db = freshDb();
  const all = listGames(db, {});
  assert.equal(all.length, 10);
  assert.equal(getGameBySlug(db, "counter-strike-2")?.coverUrl, "/covers/counter-strike-2.jpg");
  assert.equal(getGameBySlug(db, "dota-2")?.developer, "Valve");
  assert.equal(all[0]?.title, "Disco Elysium");
  assert.equal(getGameBySlug(db, "hollow-knight")?.coverUrl, "/covers/hollow-knight.jpg");

  const platformers = listGames(db, { genre: "Платформер" });
  assert.deepEqual(
    platformers.map((game) => game.title),
    ["Celeste"],
  );

  const found = listGames(db, { q: "valve", sort: "title" });
  assert.deepEqual(
    found.map((game) => game.title),
    ["Counter-Strike 2", "Dota 2", "Portal 2"],
  );

  const hollow = getGameBySlug(db, "hollow-knight");
  assert.ok(hollow);
  assert.equal(hollow.avgRating, 9);
  assert.equal(hollow.reviewCount, 3);

  const demo = findUserByEmail(db, "demo@polka.local");
  const mark = findUserByEmail(db, "mark@polka.local");
  assert.ok(demo && mark);

  const duplicate = createReview(db, hollow.id, demo.id, {
    rating: 6,
    title: "Второй раз",
    body: "Этот отзыв не должен сохраниться, потому что один уже есть.",
  });
  assert.match(duplicate ?? "", /уже оставили/);

  const created = createGame(
    db,
    {
      title: "Тестовая игра",
      description: "Короткая карточка, которую добавили в тесте, чтобы проверить каталог.",
      genre: "Инди",
      releaseYear: 2024,
      developer: "Полка",
      coverUrl: null,
      source: "manual",
    },
    demo.id,
  );
  assert.equal(created.ok, true);

  const removedByStranger = deleteGame(db, "testovaya-igra", mark.id);
  assert.equal(removedByStranger, false);
  assert.ok(getGameBySlug(db, "testovaya-igra"));

  const removedByOwner = deleteGame(db, "testovaya-igra", demo.id);
  assert.equal(removedByOwner, true);
  assert.equal(getGameBySlug(db, "testovaya-igra"), null);
});
