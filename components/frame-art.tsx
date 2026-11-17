import { cn } from "@/lib/utils";

const wash = {
  teal: "from-primary/40",
  coral: "from-secondary/50",
  mist: "from-white/25",
  night: "from-primary/20",
} as const;

export function FrameArt({
  tone,
  numeral,
  kind,
  className,
}: {
  tone: keyof typeof wash;
  numeral: string;
  kind: "image" | "video";
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-lg bg-[#0b0e13]", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent", wash[tone])} />
      <div className="absolute inset-[10%] border border-white/15" />
      <div className="absolute start-[8%] top-[10%] h-7 w-7 border-s-2 border-t-2 border-primary" />
      <div className="absolute end-[8%] bottom-[10%] h-7 w-7 border-b-2 border-e-2 border-secondary" />
      <div className="absolute inset-x-[18%] top-1/2 h-px bg-white/20" />
      <span className="absolute bottom-[12%] start-[12%] font-mono text-[11px] tracking-[0.2em] text-white/75">
        {numeral}
      </span>
      {kind === "video" ? (
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
            <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}
