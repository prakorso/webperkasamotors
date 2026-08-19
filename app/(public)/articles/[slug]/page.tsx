import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleContent } from "@/components/public/article-content";
import { getArticleBySlug, getArticleRedirectSlug } from "@/lib/data/articles";

// See app/layout.tsx for why this fallback is the production URL, not localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata(
  props: PageProps<"/articles/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt ?? undefined;
  const canonicalUrl = `${siteUrl}/articles/${article.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
      publishedTime: article.publishedAt ?? undefined,
    },
  };
}

export default async function ArticleDetailPage(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    // Miss — check whether this slug matches an article's *previous*
    // identity before giving up, same redirect philosophy as
    // /cars/[slug] and /motorcycles/[slug] (lib/data/vehicles.ts:
    // getVehicleRedirectTarget).
    const currentSlug = await getArticleRedirectSlug(slug);
    if (currentSlug) permanentRedirect(`/articles/${currentSlug}`);
    notFound();
  }

  const publishedLabel = formatPublishedDate(article.publishedAt);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:px-8 lg:py-16">
      <Link
        href="/articles"
        className="font-body text-[13px] uppercase tracking-[0.08em] text-muted hover:text-primary"
      >
        ← Articles
      </Link>

      <div className="mt-6">
        {article.category && (
          <span className="font-body text-[11px] uppercase tracking-[0.08em] text-primary">
            {article.category}
          </span>
        )}
        <h1 className="mt-2 font-display text-headline-lg text-ink lg:text-display-sm">
          {article.title}
        </h1>
        {publishedLabel && (
          <p className="mt-3 font-body text-[13px] text-muted">{publishedLabel}</p>
        )}
      </div>

      {article.coverImageUrl && (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden border border-border bg-surface-muted">
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            priority
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8">
        <ArticleContent content={article.content} />
      </div>

      {article.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="border border-border bg-surface-muted px-3 py-1.5 font-body text-[12px] text-ink"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
