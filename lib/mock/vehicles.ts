import type { Vehicle, VehicleMedia } from "@/lib/types";

/**
 * Development-only fixture data.
 *
 * This is the ONLY file allowed to contain hardcoded vehicle records —
 * every screen consumes vehicles through lib/data/vehicles.ts, never by
 * importing this array directly. That indirection is what lets Phase 2
 * swap this file for Supabase queries without touching any component.
 */
export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    stockNumber: "PM-0001",
    slug: "bmw-m4-competition",
    vehicleType: "CAR",
    brand: "BMW",
    model: "M4",
    variant: "Competition",
    year: 2024,
    price: 2_850_000_000,
    currency: "IDR",
    mileageKm: 4_200,
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    exteriorColor: "Isle of Man Green",
    condition: "USED",
    status: "AVAILABLE",
    isFeatured: true,
    description:
      "A one-owner M4 Competition finished in Isle of Man Green over a full merino leather interior. Full BMW service history, carbon ceramic brakes, and adaptive M suspension.",
    highlights: ["503 hp twin-turbo I6", "0–100 km/h in 3.8s", "Carbon ceramic brakes"],
    seoTitle: "BMW M4 Competition (2024) — Perkasa Motors",
    seoDescription:
      "2024 BMW M4 Competition, 4,200 km, Isle of Man Green. Curated and inspected by Perkasa Motors.",
  },
  {
    id: "v2",
    stockNumber: "PM-0002",
    slug: "mercedes-benz-c300",
    vehicleType: "CAR",
    brand: "Mercedes-Benz",
    model: "C300",
    variant: "AMG Line",
    year: 2023,
    price: 1_150_000_000,
    currency: "IDR",
    mileageKm: 9_800,
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    exteriorColor: "Obsidian Black",
    condition: "USED",
    status: "AVAILABLE",
    isFeatured: true,
    description:
      "C300 AMG Line with the Night Package and Burmester surround sound. Immaculate condition, dealer-maintained.",
    highlights: ["2.0L turbo, 258 hp", "AMG Line exterior", "Burmester sound system"],
  },
  {
    id: "v3",
    stockNumber: "PM-0003",
    slug: "porsche-911-carrera-s",
    vehicleType: "CAR",
    brand: "Porsche",
    model: "911",
    variant: "Carrera S",
    year: 2022,
    price: 4_200_000_000,
    currency: "IDR",
    mileageKm: 8_400,
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    exteriorColor: "GT Silver Metallic",
    condition: "USED",
    status: "RESERVED",
    isFeatured: true,
    description:
      "992-generation Carrera S with PDK, Sport Chrono Package, and PASM sport suspension.",
    highlights: ["443 hp flat-six", "PDK dual-clutch", "Sport Chrono Package"],
  },
  {
    id: "v4",
    stockNumber: "PM-0004",
    slug: "toyota-alphard",
    vehicleType: "CAR",
    brand: "Toyota",
    model: "Alphard",
    variant: "2.5 G",
    year: 2023,
    price: 980_000_000,
    currency: "IDR",
    mileageKm: 12_500,
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    exteriorColor: "Pearl White",
    condition: "USED",
    status: "AVAILABLE",
    isFeatured: true,
    description:
      "Executive-spec Alphard with captain seats, rear entertainment, and full dealer records.",
    highlights: ["Captain seats", "Rear entertainment", "Full service records"],
  },
  {
    id: "v5",
    stockNumber: "PM-0005",
    slug: "ducati-panigale-v4-s",
    vehicleType: "MOTORCYCLE",
    brand: "Ducati",
    model: "Panigale",
    variant: "V4 S",
    year: 2024,
    price: 1_150_000_000,
    currency: "IDR",
    mileageKm: 1_200,
    transmission: "MANUAL",
    fuelType: "PETROL",
    exteriorColor: "Ducati Red",
    condition: "USED",
    status: "AVAILABLE",
    isFeatured: false,
    description:
      "Low-mileage Panigale V4 S with Öhlins electronic suspension and full Akrapovič exhaust.",
    highlights: ["214 hp V4", "Öhlins electronic suspension", "Akrapovič exhaust"],
  },
  {
    id: "v6",
    stockNumber: "PM-0006",
    slug: "bmw-r1250gs-adventure",
    vehicleType: "MOTORCYCLE",
    brand: "BMW",
    model: "R 1250 GS",
    variant: "Adventure",
    year: 2023,
    price: 720_000_000,
    currency: "IDR",
    mileageKm: 12_500,
    transmission: "MANUAL",
    fuelType: "PETROL",
    exteriorColor: "Kalamata Metallic Matt",
    condition: "USED",
    status: "SOLD",
    isFeatured: false,
    description:
      "Fully-equipped GS Adventure with the touring and comfort packages, ready for long-distance riding.",
    highlights: ["136 hp boxer twin", "Touring package", "Adaptive cornering lights"],
  },
];

export const MOCK_VEHICLE_MEDIA: VehicleMedia[] = MOCK_VEHICLES.flatMap(
  (vehicle) =>
    [1, 2, 3].map((n, i) => ({
      id: `${vehicle.id}-m${n}`,
      vehicleId: vehicle.id,
      mediaType: (["EXTERIOR", "INTERIOR", "OTHER"] as const)[i],
      url: `/mock/vehicles/${vehicle.slug}/${n}.svg`,
      altText: `${vehicle.brand} ${vehicle.model} — ${
        ["exterior", "interior", "detail"][i]
      } photo placeholder`,
      isPrimary: n === 1,
      sortOrder: n,
    }))
);
