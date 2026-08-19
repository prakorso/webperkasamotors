import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "New Article" };

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader
        title="New Article"
        description="Cover and OG images can be added once the article is created — save it first."
      />
      <ArticleForm />
    </div>
  );
}
