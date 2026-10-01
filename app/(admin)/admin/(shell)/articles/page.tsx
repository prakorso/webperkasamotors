import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleTable } from "@/components/admin/article-table";
import { buttonVariants } from "@/components/ui/button";
import { getAllArticlesForAdmin } from "@/lib/data/articles";

export const metadata: Metadata = { title: "Artikel" };

export default async function AdminArticlesPage() {
  const articles = await getAllArticlesForAdmin();

  return (
    <div>
      <PageHeader
        title="Artikel"
        description={`${articles.length} artikel. Tautan Artikel di situs baru tampil setelah ada minimal 3 artikel terbit.`}
        action={
          <Link href="/admin/articles/new" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Tulis Artikel
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted-2">
            Belum ada artikel. Tidak perlu terburu-buru: halaman Artikel baru ditampilkan di menu setelah ada minimal 3 artikel terbit.
          </p>
        </div>
      ) : (
        <ArticleTable articles={articles} />
      )}
    </div>
  );
}
