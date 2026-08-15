import type { SocialContentStatus } from "@/lib/types";
import { Badge } from "./badge";

const LABEL: Record<SocialContentStatus, string> = {
  INBOX: "Inbox",
  CLASSIFIED: "Classified",
  PUBLISHED: "Published",
  IGNORED: "Ignored",
};

const VARIANT: Record<SocialContentStatus, "success" | "warning" | "neutral" | "info"> = {
  INBOX: "info",
  CLASSIFIED: "warning",
  PUBLISHED: "success",
  IGNORED: "neutral",
};

export function ContentStatusBadge({ status }: { status: SocialContentStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
