import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/article-form";
import { ArticleImageUpload } from "@/components/admin/article-image-upload";
import { getArticleByIdForAdmin } from "@/lib/data/articles";

export async function generateMetadata(
  props: PageProps<"/admin/articles/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const article = await getArticleByIdForAdmin(id);
  return { title: article ? article.title : "Edit Article" };
}

export default async function EditArticlePage(props: PageProps<"/admin/articles/[id]">) {
  const { id } = await props.params;
  const article = await getArticleByIdForAdmin(id);
  if (!article) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader title={article.title} description={`/articles/${article.slug}`} />
        <ArticleForm article={article} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Images</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ArticleImageUpload
            articleId={article.id}
            field="cover"
            label="Cover Image"
            hint="Shown on the listing page and at the top of the article."
            currentUrl={article.coverImageUrl}
          />
          <ArticleImageUpload
            articleId={article.id}
            field="og"
            label="OG Image"
            hint="Used for social/link previews. Falls back to the cover image if not set."
            currentUrl={article.ogImageUrl}
          />
        </div>
      </div>
    </div>
  );
}
