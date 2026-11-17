import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
