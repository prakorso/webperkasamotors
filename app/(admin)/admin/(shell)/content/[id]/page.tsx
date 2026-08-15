import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";
import { getContentByIdForAdmin } from "@/lib/data/social-content";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export async function generateMetadata(
  props: PageProps<"/admin/content/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const content = await getContentByIdForAdmin(id);
  return { title: content ? content.caption || "Edit Content" : "Edit Content" };
}

export default async function EditContentPage(props: PageProps<"/admin/content/[id]">) {
  const { id } = await props.params;
  const [content, vehicles] = await Promise.all([
    getContentByIdForAdmin(id),
    getAllVehiclesForAdmin(),
  ]);
  if (!content) notFound();

  const vehicleOptions = vehicles.map((v) => ({ id: v.id, label: `${vehicleTitle(v)} — ${v.stockNumber}` }));

  return (
    <div>
      <PageHeader title={content.caption || "Edit Content"} description={content.permalink} />
      <ContentForm content={content} vehicleOptions={vehicleOptions} />
    </div>
  );
}
