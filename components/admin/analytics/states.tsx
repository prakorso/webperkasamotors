import { cn } from "@/lib/utils/cn";
import { formatRangeLabel, type DateRange } from "@/lib/analytics/ranges";

const jakartaTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "Diperbarui 4 Okt 07.15 WIB" — the time the (30-minute cached) data was fetched. */
export function formatUpdated(iso: string): string {
  return `Diperbarui ${jakartaTime.format(new Date(iso)).replace(",", "")} WIB`;
}

export function SectionNotice({
  tone,
  title,
  children,
}: {
  tone: "neutral" | "processing" | "error";
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border p-5",
        tone === "error" && "border-primary/40 bg-primary/5",
        tone === "processing" && "border-warning/30 bg-warning-bg",
        tone === "neutral" && "border-border bg-surface"
      )}
    >
      <p className="font-body text-[14px] font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 font-body text-[13px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function SectionFooter({
  fetchedAt,
  range,
  note,
}: {
  fetchedAt?: string;
  range?: Pick<DateRange, "startDate" | "endDate">;
  note?: string;
}) {
  return (
    <p className="mt-4 font-body text-[12px] leading-relaxed text-muted-2">
      {range && <>Periode {formatRangeLabel(range)} (WIB). </>}
      {fetchedAt && <>{formatUpdated(fetchedAt)}. </>}
      {note}
    </p>
  );
}

export const DATA_CAVEAT =
  "Angka GA4 dapat berubah hingga 48 jam. Pengunjung yang menolak cookie hanya terhitung sebagian.";
