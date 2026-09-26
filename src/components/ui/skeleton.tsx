import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Token-matched: bg-muted over bg-surface cards — never generic grey, so a
  // loading page keeps the orange/navy identity while content resolves.
  return <div className={cn("animate-pulse rounded-md bg-muted border border-border/50", className)} {...props} />;
}

export { Skeleton };
