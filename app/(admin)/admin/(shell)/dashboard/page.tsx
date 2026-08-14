import type { Metadata } from "next";
import { Car, Users, TrendingUp, Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { getAllLeadsForAdmin } from "@/lib/data/leads";
import { vehicleTitle, leadInterestLabel } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [vehicles, leads] = await Promise.all([
    getAllVehiclesForAdmin(),
    getAllLeadsForAdmin(),
  ]);

  const available = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const reserved = vehicles.filter((v) => v.status === "RESERVED").length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;

  return (
    <div>
      <PageHeader
        title="Showroom Overview"
        description="Real-time counts computed from the current mock inventory and leads."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Stock" value={String(available)} sublabel="status: available" icon={Car} />
        <StatCard label="Reserved" value={String(reserved)} sublabel="pending close" icon={Clock} />
        <StatCard
          label="New Leads"
          value={String(newLeads)}
          sublabel="awaiting first contact"
          icon={Users}
          emphasis
        />
        <StatCard label="Total Vehicles" value={String(vehicles.length)} sublabel="all statuses" icon={TrendingUp} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="border border-border bg-surface p-6 lg:col-span-7">
          <h2 className="font-display text-headline-sm text-ink">Recent Activity</h2>
          <p className="mt-1 font-body text-[12px] text-muted">
            PLACEHOLDER — will read from vehicle_status_history / lead_status_history once Supabase is connected.
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {leads.slice(0, 4).map((lead) => (
              <li key={lead.id} className="flex items-start justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-body text-[13px] text-ink">
                    <span className="font-semibold">{lead.customerName}</span> —{" "}
                    {leadInterestLabel(lead, vehicles)}
                  </p>
                  <p className="font-body text-[12px] text-muted">{lead.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-border bg-surface p-6 lg:col-span-5">
          <h2 className="font-display text-headline-sm text-ink">Recently Added Vehicles</h2>
          <ul className="mt-6 flex flex-col gap-4">
            {vehicles.slice(0, 4).map((vehicle) => (
              <li key={vehicle.id} className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
                <span className="font-body text-[13px] text-ink">{vehicleTitle(vehicle)}</span>
                <span className="font-body text-[12px] text-muted">{vehicle.stockNumber}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
