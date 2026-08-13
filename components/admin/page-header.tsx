import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="font-display text-headline-lg text-ink">{title}</h1>
        {description && (
          <p className="mt-1 font-body text-[13px] text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
