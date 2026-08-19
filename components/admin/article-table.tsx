import Link from "next/link";
import type { Article } from "@/lib/types";
import { ArticleStatusBadge } from "@/components/ui/article-status-badge";

export function ArticleTable({ articles }: { articles: Article[] }) {
  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="px-4 py-3" />
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Title
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Category
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Status
            </th>
            <th className="px-4 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-muted">
              Published
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
              <td className="px-4 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden border border-border bg-surface-muted">
                  {article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
              </td>
              <td className="max-w-[320px] px-4 py-3 font-body text-[13px] text-ink">
                <span className="line-clamp-2 font-medium">{article.title}</span>
                <span className="mt-0.5 block font-body text-[12px] text-muted">/{article.slug}</span>
              </td>
              <td className="px-4 py-3 font-body text-[13px] text-muted">{article.category ?? "—"}</td>
              <td className="px-4 py-3">
                <ArticleStatusBadge status={article.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-body text-[13px] text-muted">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="font-body text-[13px] font-medium text-primary hover:text-ink"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
