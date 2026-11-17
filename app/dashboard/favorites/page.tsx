import type { Metadata } from "next";
import { FavoritesPage } from "@/components/dashboard/favorites-page";

export const metadata: Metadata = { title: "المفضلة" };

export default function Page() {
  return <FavoritesPage />;
}
