import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleTable } from "@/components/admin/article-table";
import { buttonVariants } from "@/components/ui/button";
import { getAllArticlesForAdmin } from "@/lib/data/articles";

export const metadata: Metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  const articles = await getAllArticlesForAdmin();

  return (
    <div>
      <PageHeader
        title="Articles"
        description={`${articles.length} article${articles.length === 1 ? "" : "s"} — editorial/SEO content for the public site.`}
        action={
          <Link href="/admin/articles/new" className={buttonVariants({ variant: "primary", size: "lg" })}>
            New Article
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted-2">
            No articles yet. Create the first one to publish editorial content on the public site.
          </p>
        </div>
      ) : (
        <ArticleTable articles={articles} />
      )}
    </div>
  );
}
