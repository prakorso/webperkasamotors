import type { Metadata } from "next";
import { ArticleCard } from "@/components/public/article-card";
import { Pagination } from "@/components/public/pagination";
import { getPublishedArticles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Articles",
  description: "Perkasa Motors editorial content — buying guides, maintenance tips, and news.",
};

export default async function ArticlesPage(props: PageProps<"/articles">) {
  const searchParams = await props.searchParams;
  const requestedPage = Number(searchParams?.page) || 1;

  const { articles, page, totalPages } = await getPublishedArticles(requestedPage);

  return (
    <div className="mx-auto max-w-container px-6 py-12 md:px-8 lg:px-margin lg:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">Articles</h1>
        <p className="mt-3 font-body text-body-lg text-muted">
          Buying guides, maintenance tips, and news from Perkasa Motors.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="border border-border bg-surface p-10 text-center font-body text-body text-muted">
          No articles published yet — check back soon.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath="/articles" />
        </>
      )}
    </div>
  );
}
