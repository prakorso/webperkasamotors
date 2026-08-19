import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";

function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ArticleCard({ article }: { article: Article }) {
  const publishedLabel = formatPublishedDate(article.publishedAt);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col border border-border bg-surface transition-colors hover:border-ink"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface-muted">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {article.category && (
          <span className="font-body text-[11px] uppercase tracking-[0.08em] text-primary">
            {article.category}
          </span>
        )}
        <h3 className="font-display text-headline-sm text-ink">{article.title}</h3>
        {article.excerpt && (
          <p className="line-clamp-2 font-body text-[13px] text-muted">{article.excerpt}</p>
        )}
        {publishedLabel && (
          <span className="mt-auto pt-2 font-body text-[12px] text-muted-2">{publishedLabel}</span>
        )}
      </div>
    </Link>
  );
}
