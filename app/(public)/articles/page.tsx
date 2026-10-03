import type { Metadata } from "next";
import { cache } from "react";
import { paginatedCanonical } from "@/lib/site-url";
import { ArticleCard } from "@/components/public/article-card";
import { Pagination } from "@/components/public/pagination";
import { getPublishedArticles } from "@/lib/data/articles";

// Shared by generateMetadata and the page; an out-of-range ?page= canonicalizes to the last real page.
const loadArticles = cache((page: number) => getPublishedArticles(page));

export async function generateMetadata(props: PageProps<"/articles">): Promise<Metadata> {
  const { page, totalPages } = await loadArticles(Number((await props.searchParams)?.page) || 1);
  return {
    title: "Artikel",
    description: "Artikel dari Perkasa Motors.",
    alternates: { canonical: paginatedCanonical("/articles", Math.min(page, totalPages)) },
  };
}

export default async function ArticlesPage(props: PageProps<"/articles">) {
  const searchParams = await props.searchParams;
  const requestedPage = Number(searchParams?.page) || 1;

  const { articles, page, totalPages } = await loadArticles(requestedPage);

  return (
    <div className="mx-auto max-w-container px-6 py-12 md:px-8 lg:px-margin lg:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">Artikel</h1>
        <p className="mt-3 font-body text-body-lg text-muted">
          Artikel dari Perkasa Motors.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="rounded-[24px] border border-border/80 bg-surface p-10 text-center font-body text-body text-muted shadow-[0_12px_32px_rgba(17,19,21,0.05)]">
          Belum ada artikel.
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
