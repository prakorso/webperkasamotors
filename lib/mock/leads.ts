import type { Lead } from "@/lib/types";

/** Admin Leads screen fixture data — no form on the public site writes here yet. */
export const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    customerName: "Sarah Jenkins",
    phone: "+62 812-3456-7890",
    email: "sarah.jenkins@example.com",
    message: "Is the BMW M4 Competition still available? Interested in a test drive.",
    interestedVehicleId: "v1",
    source: "WEBSITE",
    status: "NEW",
    createdAt: "2026-08-13T09:12:00Z",
  },
  {
    id: "l2",
    customerName: "Andi Wijaya",
    phone: "+62 813-2233-4455",
    message: "Following up on the Panigale V4 S — can you share the full service history?",
    interestedVehicleId: "v5",
    source: "INSTAGRAM",
    status: "CONTACTED",
    assignedStaffName: "Dewi Lestari",
    createdAt: "2026-08-11T14:30:00Z",
  },
  {
    id: "l3",
    customerName: "Michael Tanoto",
    email: "m.tanoto@example.com",
    message: "General inquiry about financing options for a vehicle under Rp 1.5B.",
    interestedVehicleId: null,
    source: "WHATSAPP",
    status: "QUALIFIED",
    assignedStaffName: "Dewi Lestari",
    createdAt: "2026-08-10T08:05:00Z",
  },
  {
    id: "l4",
    customerName: "Budi Santoso",
    phone: "+62 811-9988-7766",
    message: "Would like to schedule a site visit for the Porsche 911 this weekend.",
    interestedVehicleId: "v3",
    source: "WEBSITE",
    status: "SITE_VISIT",
    assignedStaffName: "Rian Pratama",
    createdAt: "2026-08-08T11:47:00Z",
  },
];
