import { isHttpUrl } from "@/lib/youtube";

export type LessonRecord = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  position: number;
  published: boolean;
};

export type CourseRecord = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  position: number;
  published: boolean;
  lessons: LessonRecord[];
};

export type CourseContentInput = {
  title: string;
  description?: string;
  videoUrl?: string;
  published?: boolean;
};

const TITLE_MAX = 140;
const DESCRIPTION_MAX = 4000;
const URL_MAX = 500;

export function cleanCourseContent(input: CourseContentInput) {
  const title = input.title.trim();
  const description = (input.description ?? "").trim();
  const videoUrl = (input.videoUrl ?? "").trim();
  if (title.length < 1 || title.length > TITLE_MAX) return null;
  if (description.length > DESCRIPTION_MAX) return null;
  if (videoUrl.length > URL_MAX) return null;
  if (videoUrl && !isHttpUrl(videoUrl)) return null;
  return {
    title,
    description,
    video_url: videoUrl,
    published: input.published === true,
  };
}
