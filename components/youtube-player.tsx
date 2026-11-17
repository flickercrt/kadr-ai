export function YoutubePlayer({ title, embedUrl }: { title: string; embedUrl: string }) {
  return (
    <div className="aspect-video bg-black">
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
