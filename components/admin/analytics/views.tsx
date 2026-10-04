import { Badge } from "@/components/ui/badge";
import { ADMIN_STATUS_VARIANT, adminStatusLabel } from "@/lib/utils/admin-vehicle";
import type { VehicleStatus } from "@/lib/types";
import { DASH, formatCount, formatPercent, formatPosition } from "@/lib/analytics/format";
import type { AcquisitionRow, CtaRow, SearchRow, VehiclePerformance } from "@/lib/analytics/metrics";
import type { AcquisitionData, CtaData, InventoryData, OverviewData, SearchData } from "@/lib/analytics/marketing-analytics";
import type { SectionState } from "@/lib/analytics/sections";
import { formatRangeLabel } from "@/lib/analytics/ranges";
import { DataTable, type Column } from "./data-table";
import { InsightCard, Kpi } from "./kpi";
import { DATA_CAVEAT, SectionFooter, SectionNotice } from "./states";
import { TrendChart } from "./trend-chart";
import { VehicleThumb } from "./vehicle-thumb";

/** Shared handling of the non-data states; returns a node when the section has nothing to table. */
function sectionProblem<T>(section: SectionState<T>, source: string, emptyText = "Belum ada data untuk periode ini."): React.ReactNode | null {
  if (section.state === "error") {
    return (
      <SectionNotice tone="error" title={`Data ${source} tidak dapat dimuat`}>
        {section.message} Bagian lain tetap berfungsi.
      </SectionNotice>
    );
  }
  if (section.state === "empty") return <SectionNotice tone="neutral" title={emptyText} />;
  return null;
}

const statusBadge = (status: string) => (
  <Badge variant={ADMIN_STATUS_VARIANT[status as VehicleStatus] ?? "neutral"}>{adminStatusLabel(status as VehicleStatus)}</Badge>
);

// ---------------------------------------------------------------------------

export function OverviewView({ section }: { section: SectionState<OverviewData> }) {
  const problem = sectionProblem(section, "GA4");
  if (problem) return problem;
  if (section.state !== "ok") return null;
  const { kpis, topVehicle, topSource, sell, trend, range } = section.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Pengguna" value={formatCount(kpis.users)} hint="pengguna aktif" />
        <Kpi label="Sesi" value={formatCount(kpis.sessions)} />
        <Kpi label="Tayangan Halaman" value={formatCount(kpis.pageViews)} />
        <Kpi label="Tayangan Unit" value={formatCount(kpis.vehicleViews)} hint="halaman detail unit" />
        <Kpi label="Klik WhatsApp" value={formatCount(kpis.whatsappClicks)} hint="niat menghubungi, bukan percakapan" />
        <Kpi
          label="Konversi WhatsApp"
          value={formatPercent(kpis.conversionRate)}
          hint={`${formatCount(kpis.waSessions)} dari ${formatCount(kpis.sessions)} sesi punya klik`}
          emphasis
        />
      </div>

      <TrendChart points={trend} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InsightCard title="Unit paling banyak dilihat">
          {topVehicle ? (
            <>
              <p className="font-body text-[14px] font-medium text-ink">{topVehicle.label}</p>
              <p className="mt-0.5 font-body text-[12px] text-muted">{topVehicle.stockNumber}</p>
              <div className="mt-2 flex items-center gap-2">
                {statusBadge(topVehicle.status)}
                <span className="font-body text-[12px] text-muted tabular-nums">{formatCount(topVehicle.views)} tayangan</span>
              </div>
            </>
          ) : (
            <p className="font-body text-[13px] text-muted">Belum ada tayangan unit pada periode ini.</p>
          )}
        </InsightCard>
        <InsightCard title="Sumber trafik teratas">
          {topSource ? (
            <>
              <p className="font-body text-[14px] font-medium text-ink">{topSource.sourceMedium}</p>
              <p className="mt-1 font-body text-[12px] text-muted tabular-nums">{formatCount(topSource.sessions)} sesi</p>
            </>
          ) : (
            <p className="font-body text-[13px] text-muted">Belum ada data sumber.</p>
          )}
        </InsightCard>
        <InsightCard title="Minat Jual Kendaraan">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-body text-[11px] text-muted">Tayangan /sell</dt>
              <dd className="mt-1 font-display text-[22px] font-semibold tabular-nums text-ink">{formatCount(sell.pageViews)}</dd>
            </div>
            <div>
              <dt className="font-body text-[11px] text-muted">Klik WhatsApp form</dt>
              <dd className="mt-1 font-display text-[22px] font-semibold tabular-nums text-ink">{formatCount(sell.whatsappClicks)}</dd>
            </div>
          </dl>
        </InsightCard>
      </div>
      <SectionFooter range={range} fetchedAt={section.fetchedAt} note={DATA_CAVEAT} />
    </div>
  );
}

// ---------------------------------------------------------------------------

const ACQ_COLUMNS: Column<AcquisitionRow>[] = [
  { header: "Sumber / Medium", cell: (r) => <span className="font-medium">{r.sourceMedium}</span> },
  { header: "Kampanye", cell: (r) => r.campaign },
  { header: "Pengguna", numeric: true, cell: (r) => formatCount(r.users) },
  { header: "Sesi", numeric: true, cell: (r) => formatCount(r.sessions) },
  { header: "Tayangan Unit", numeric: true, cell: (r) => formatCount(r.vehicleViews) },
  { header: "Klik WhatsApp", numeric: true, cell: (r) => formatCount(r.whatsappClicks) },
  { header: "Konversi WA", numeric: true, cell: (r) => formatPercent(r.conversionRate) },
];

export function AcquisitionView({ section }: { section: SectionState<AcquisitionData> }) {
  const problem = sectionProblem(section, "GA4");
  if (problem) return problem;
  if (section.state !== "ok") return null;
  return (
    <div>
      <DataTable columns={ACQ_COLUMNS} rows={section.data.rows} rowKey={(r) => `${r.sourceMedium}|${r.campaign}`} caption="Akuisisi trafik per sumber dan kampanye" />
      <SectionFooter
        range={section.data.range}
        fetchedAt={section.fetchedAt}
        note={`Tayangan Unit = kejadian view_item. Konversi WA = sesi dengan klik WhatsApp ÷ sesi pada baris itu. Nilai seperti (not set) dan (data not available) ditampilkan apa adanya (kunjungan tanpa atribusi atau tanpa cookie). ${DATA_CAVEAT}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

const INVENTORY_COLUMNS: Column<VehiclePerformance>[] = [
  { header: "Foto", cell: (r) => <VehicleThumb src={r.imageUrl} /> },
  {
    header: "Unit",
    cell: (r) => (
      <>
        <span className="font-medium">{r.label}</span>
        <span className="mt-0.5 block text-[12px] text-muted">{r.stockNumber}</span>
      </>
    ),
  },
  { header: "Status", cell: (r) => statusBadge(r.status) },
  { header: "Tayangan", numeric: true, cell: (r) => formatCount(r.views) },
  { header: "Klik WhatsApp", numeric: true, cell: (r) => (r.clicks === null ? DASH : formatCount(r.clicks)) },
  { header: "Klik ÷ Tayangan", numeric: true, cell: (r) => formatPercent(r.clicksPerView) },
];

export function InventoryView({ section }: { section: SectionState<InventoryData> }) {
  const problem = sectionProblem(section, "unit", "Belum ada unit yang tayang.");
  if (problem) return problem;
  if (section.state === "empty" || section.state === "error") return null;
  const data = section.data;
  if (!data) return null;
  return (
    <div className="space-y-4">
      {section.state === "processing" && (
        <SectionNotice tone="processing" title="Data klik per unit sedang diproses Google">
          Data view unit tetap tersedia. Kolom klik menampilkan {DASH} sampai Google selesai memproses.
        </SectionNotice>
      )}
      <DataTable columns={INVENTORY_COLUMNS} rows={data.rows} rowKey={(r) => r.stockNumber} caption="Performa per unit" />
      {data.orphans.length > 0 && (
        <SectionNotice tone="neutral" title="Peringatan data">
          {data.orphans.length} ID unit di analitik tidak cocok dengan unit saat ini ({data.orphans.map((o) => o.itemId).join(", ")}) dan tidak dihitung sebagai unit.
        </SectionNotice>
      )}
      <SectionFooter
        range={data.range}
        fetchedAt={section.fetchedAt}
        note={`Klik ÷ Tayangan = klik WhatsApp unit ÷ tayangan unit (bukan per sesi). ${DASH} = belum tersedia. Data sebelum tanggal pembuatan unit diabaikan. ${DATA_CAVEAT}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

const CTA_COLUMNS: Column<CtaRow>[] = [
  {
    header: "Lokasi CTA",
    cell: (r) => (
      <>
        <code className="font-mono text-[12px]">{r.location}</code>
        {!r.canonical && <span className="ml-2 text-[11px] text-muted">(tidak dikenal)</span>}
      </>
    ),
  },
  { header: "Klik WhatsApp", numeric: true, cell: (r) => formatCount(r.clicks) },
  { header: "Porsi", numeric: true, cell: (r) => formatPercent(r.share) },
];

export function CtaView({ section }: { section: SectionState<CtaData> }) {
  const problem = sectionProblem(section, "GA4");
  if (problem) return problem;
  if (section.state === "processing") {
    return <SectionNotice tone="processing" title="Data CTA sedang diproses Google">Coba kembali setelah data tersedia.</SectionNotice>;
  }
  if (section.state !== "ok") return null;
  const { rows, unclassified, total, range } = section.data;
  return (
    <div className="space-y-4">
      <DataTable columns={CTA_COLUMNS} rows={rows} rowKey={(r) => r.location} caption="Klik WhatsApp per lokasi CTA" />
      {unclassified > 0 && (
        <SectionNotice tone="neutral" title={`${formatCount(unclassified)} dari ${formatCount(total)} klik belum punya lokasi CTA`}>
          Klik yang terjadi sebelum dimensi CTA aktif tidak dapat diklasifikasi dan tidak dibagi ulang.
        </SectionNotice>
      )}
      <SectionFooter range={range} fetchedAt={section.fetchedAt} note={`Porsi dihitung dari semua klik WhatsApp. Tidak ada tingkat konversi per CTA karena tidak ada data tayangan per CTA. ${DATA_CAVEAT}`} />
    </div>
  );
}

// ---------------------------------------------------------------------------

const searchColumns = (label: string, render: (r: SearchRow) => React.ReactNode): Column<SearchRow>[] => [
  { header: label, cell: render, className: "max-w-[420px] break-words" },
  { header: "Klik", numeric: true, cell: (r) => formatCount(r.clicks) },
  { header: "Tayangan", numeric: true, cell: (r) => formatCount(r.impressions) },
  { header: "CTR", numeric: true, cell: (r) => formatPercent(r.ctr) },
  { header: "Posisi", numeric: true, cell: (r) => formatPosition(r.position) },
];

export function SearchView({ section }: { section: SectionState<SearchData> }) {
  const problem = sectionProblem(section, "Search Console");
  if (problem) return problem;
  if (section.state === "processing") {
    return (
      <SectionNotice tone="processing" title="Data Search Console belum tersedia">
        Google masih memproses data situs ini. Tab ini akan terisi otomatis begitu data tersedia (biasanya tertunda 2–3 hari).
      </SectionNotice>
    );
  }
  if (section.state !== "ok") return null;
  const { totals, queries, pages, range } = section.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Klik" value={formatCount(totals.clicks)} />
        <Kpi label="Tayangan" value={formatCount(totals.impressions)} />
        <Kpi label="CTR" value={formatPercent(totals.ctr)} />
        <Kpi label="Posisi rata-rata" value={formatPosition(totals.position)} />
      </div>
      <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Kueri teratas</h3>
      {queries.length ? (
        <DataTable columns={searchColumns("Kueri", (r) => r.key)} rows={queries} rowKey={(r) => r.key} caption="Kueri pencarian teratas" />
      ) : (
        <SectionNotice tone="neutral" title="Belum ada kueri pada periode ini." />
      )}
      <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Halaman tujuan teratas</h3>
      {pages.length ? (
        <DataTable columns={searchColumns("Halaman", (r) => r.key.replace(/^https?:\/\/[^/]+/, "") || "/")} rows={pages} rowKey={(r) => r.key} caption="Halaman tujuan pencarian teratas" />
      ) : (
        <SectionNotice tone="neutral" title="Belum ada halaman pada periode ini." />
      )}
      <SectionFooter
        range={range}
        fetchedAt={section.fetchedAt}
        note={`Data Search Console tertunda 2–3 hari; tanggal mengikuti Pacific Time (${formatRangeLabel(range)}). CTR dan posisi adalah nilai dari Google.`}
      />
    </div>
  );
}
