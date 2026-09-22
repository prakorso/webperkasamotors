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
      className="group flex flex-col rounded-[20px] border border-border/80 bg-surface shadow-[0_12px_32px_rgba(17,19,21,0.05)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_20px_48px_rgba(17,19,21,0.09)]"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-[20px] bg-surface-muted">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {article.category && (
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
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
