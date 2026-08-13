import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Homepage hero — three distinct typographic compositions, matching the
 * proven Stitch pattern: 72px desktop / 56px tablet / 40px mobile, each
 * with its own line-height and hero height, not one size scaled down.
 */
export function Hero() {
  return (
    <section className="relative flex h-[68vh] w-full items-center overflow-hidden bg-ink md:h-[70vh] lg:h-[80vh]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(215,25,32,0.18),transparent_60%)]" />
      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-8 lg:px-margin">
        <div className="max-w-xl lg:max-w-2xl">
          <h1 className="font-display text-display-sm text-paper md:text-display-md lg:text-display-lg">
            Presisi.
            <br />
            Performa.
            <br />
            Perkasa.
          </h1>
          <p className="mt-6 max-w-md font-body text-body text-paper/70 lg:text-body-lg">
            A curated showroom of inspected, premium vehicles — every unit
            verified before it reaches you.
          </p>
          <div className="mt-8">
            <Link href="/cars" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Lihat Stok Tersedia
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
