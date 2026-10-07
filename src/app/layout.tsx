import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Полка — отзывы на игры",
    template: "%s — Полка",
  },
  description:
    "Каталог игр, где среднюю оценку считают по отзывам людей на этом сайте.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const dark = (await cookies()).get("polka_theme")?.value === "dark";
  return (
    <html
      lang="ru"
      className={`${sourceSans.variable} ${literata.variable} h-full antialiased${dark ? " dark" : ""}`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
