export interface NavLink {
  href: string;
  label: string;
}

export const PUBLIC_NAV_LINKS: NavLink[] = [
  { href: "/cars", label: "Beli Mobil" },
  { href: "/motorcycles", label: "Beli Motor" },
  { href: "/about", label: "Tentang Kami" },
  { href: "/financing", label: "Simulasi Kredit" },
];
