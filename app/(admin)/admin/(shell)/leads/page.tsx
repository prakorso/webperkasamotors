import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { getAllLeadsForAdmin } from "@/lib/data/leads";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const [leads, vehicles] = await Promise.all([
    getAllLeadsForAdmin(),
    getAllVehiclesForAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        title="Customer Leads"
        description={`${leads.length} inquiries — mock data; the public contact/inquiry forms don't write here yet.`}
      />
      <div className="overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left">
              {["Customer", "Interested In", "Source", "Status", "Received"].map((h) => (
                <th key={h} className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const vehicle = vehicles.find((v) => v.id === lead.interestedVehicleId);
              return (
                <tr key={lead.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-body text-[13px] text-ink">
                    {lead.customerName}
                    <span className="block font-body text-[12px] text-muted">
                      {lead.phone ?? lead.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] text-muted">
                    {vehicle ? vehicleTitle(vehicle) : "General inquiry"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{lead.source}</Badge>
                  </td>
                  <td className="px-4 py-3 font-body text-[13px] font-medium text-ink">
                    {lead.status}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-body text-[13px] text-muted">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
