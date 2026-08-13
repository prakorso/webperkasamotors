import type { SocialContent } from "@/lib/types";

/**
 * Placeholder Instagram-style content — proves the "linked to a vehicle,
 * never creates one" UI slot on the vehicle detail page. No real
 * ingestion exists yet.
 */
export const MOCK_SOCIAL_CONTENT: SocialContent[] = [
  {
    id: "sc1",
    vehicleId: "v1",
    contentType: "STOCK",
    status: "PUBLISHED",
    caption: "BMW M4 Competition — available now at Perkasa Motors.",
    permalink: "#",
    thumbnailUrl: "/mock/vehicles/bmw-m4-competition/1.svg",
    postedAt: "2026-08-01",
  },
  {
    id: "sc2",
    vehicleId: "v1",
    contentType: "REVIEW",
    status: "PUBLISHED",
    caption: "Walkaround review: BMW M4 Competition in Isle of Man Green.",
    permalink: "#",
    thumbnailUrl: "/mock/vehicles/bmw-m4-competition/2.svg",
    postedAt: "2026-08-05",
  },
  {
    id: "sc3",
    vehicleId: "v3",
    contentType: "TESTIMONIAL",
    status: "PUBLISHED",
    caption: "\"Seamless process from viewing to delivery.\" — Porsche 911 buyer.",
    permalink: "#",
    thumbnailUrl: "/mock/vehicles/porsche-911-carrera-s/3.svg",
    postedAt: "2026-07-20",
  },
];
