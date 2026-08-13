import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 lg:mb-12", className)}>
      {eyebrow && (
        <p className="mb-3 font-body text-label uppercase tracking-[0.1em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-headline-lg text-ink">{title}</h2>
    </div>
  );
}
