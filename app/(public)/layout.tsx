import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { ConsentBanner } from "@/components/public/consent-banner";
import { MeasurementLoader } from "@/components/public/measurement-loader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ConsentBanner />
      <MeasurementLoader />
    </div>
  );
}
