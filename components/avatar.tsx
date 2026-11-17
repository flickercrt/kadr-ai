export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const letter = name.trim().slice(0, 1) || "•";
  return (
    <span
      className="grid place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
      style={{ width: size, height: size }}
    >
      {letter}
    </span>
  );
}
