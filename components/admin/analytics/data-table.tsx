import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  header: string;
  /** Right-align numeric columns. */
  numeric?: boolean;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/** Plain bordered table; on narrow widths it scrolls inside its own container instead of widening the page. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
}) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse font-body text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted",
                  c.numeric ? "text-right" : "text-left"
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-b-0">
              {columns.map((c) => (
                <td key={c.header} className={cn("px-4 py-2.5 align-top text-ink", c.numeric && "text-right tabular-nums", c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
