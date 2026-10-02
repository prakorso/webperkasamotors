import { redirect } from "next/navigation";

/** The standalone About page is retired; its short version is edited in Website > Beranda (Post-release simplification R1). Kept so old links and bookmarks still work. */
export default function Redirect() {
  redirect("/admin/website/homepage");
}
