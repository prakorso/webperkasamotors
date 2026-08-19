import type { ArticleStatus } from "@/lib/types";
import { Badge } from "./badge";

const LABEL: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

const VARIANT: Record<ArticleStatus, "success" | "neutral"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
