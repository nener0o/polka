export type PublicUser = {
  id: number;
  name: string;
  email: string;
};

export type GameSource = "seed" | "manual" | "rawg" | "catalog";

export type GameSort = "rating" | "reviews" | "year" | "title" | "new";

export type Game = {
  id: number;
  title: string;
  slug: string;
  description: string;
  genre: string;
  releaseYear: number | null;
  developer: string;
  coverColor: string;
  coverUrl: string | null;
  steamUrl: string | null;
  epicUrl: string | null;
  xboxUrl: string | null;
  nintendoUrl: string | null;
  websiteUrl: string | null;
  source: GameSource;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
  reviewCount: number;
  avgRating: number | null;
};

export type Review = {
  id: number;
  gameId: number;
  userId: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type MyReview = Review & {
  gameTitle: string;
  gameSlug: string;
};

export type ExternalHit = {
  externalId: string;
  title: string;
  genre: string;
  releaseYear: number | null;
  developer: string;
  coverUrl: string | null;
  source: "rawg" | "catalog";
};

export type ExternalGame = ExternalHit & {
  description: string;
};

export type ActionState = {
  error: string;
  href?: string;
  hrefLabel?: string;
  values?: Record<string, string>;
} | null;
