import { youtubeEmbedUrl, youtubeIdFromUrl } from "@/lib/youtube";

export type HomepageVideo = {
  id: string;
  title: string;
  youtubeUrl: string;
  embedUrl: string | null;
  position: number;
};

const TITLE_MAX = 140;
const URL_MAX = 500;

export function parseHomepageVideo(input: { title: string; youtubeUrl: string }) {
  const title = input.title.trim();
  const youtubeUrl = input.youtubeUrl.trim();
  if (!title || title.length > TITLE_MAX || !youtubeUrl || youtubeUrl.length > URL_MAX) return null;
  if (!youtubeIdFromUrl(youtubeUrl)) return null;
  const embedUrl = youtubeEmbedUrl(youtubeUrl);
  if (!embedUrl) return null;
  return { title, youtubeUrl, embedUrl };
}
