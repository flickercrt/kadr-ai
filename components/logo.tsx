import { brand } from "@/config/site";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <path d="M7 12 V7 H12" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" />
      <path d="M20 7 H25 V12" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" />
      <path d="M25 20 V25 H20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" />
      <path d="M12 25 H7 V20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" />
      <rect x="13" y="13" width="6" height="6" rx="1" className="fill-secondary" />
    </svg>
  );
}

export function Logo({ locale, className }: { locale: "ar" | "en"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <Mark />
      <span className="text-lg font-semibold tracking-tight">
        {brand.logoText[locale]}
        <span className="text-primary"> {brand.logoSuffix}</span>
      </span>
    </span>
  );
}
