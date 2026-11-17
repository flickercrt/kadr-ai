import Link from "next/link";

export function BotCardLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!href) return <div className={className}>{children}</div>;
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
