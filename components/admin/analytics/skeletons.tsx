/** Loading placeholders in the admin visual language (flat bordered blocks). */
const block = "animate-pulse bg-surface-muted";

export function TabSkeleton({ kpis = false }: { kpis?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Memuat data" className="space-y-4">
      {kpis && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="border border-border bg-surface p-4">
              <div className={`${block} h-3 w-20`} />
              <div className={`${block} mt-4 h-7 w-16`} />
            </div>
          ))}
        </div>
      )}
      <div className="border border-border bg-surface p-4">
        <div className={`${block} h-3 w-32`} />
        <div className={`${block} mt-4 h-40 w-full`} />
      </div>
      {!kpis && (
        <div className="border border-border bg-surface p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`${block} mb-3 h-4 w-full last:mb-0`} />
          ))}
        </div>
      )}
    </div>
  );
}
