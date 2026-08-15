import type { ElementType } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { SocialContent } from "@/lib/types";
import { detectSocialPlatform, type SocialPlatform } from "@/lib/utils/social-embed";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/icons/social-icons";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  OTHER: "the source",
};

const PLATFORM_ICON: Record<SocialPlatform, ElementType<{ size?: number }>> = {
  YOUTUBE: YoutubeIcon,
  TIKTOK: TiktokIcon,
  INSTAGRAM: InstagramIcon,
  FACEBOOK: FacebookIcon,
  OTHER: ExternalLink,
};

/**
 * Social content linked to this vehicle — backed by the `content` table
 * (lib/data/social-content.ts), added via the "paste a URL" workflow on
 * the vehicle's Inventory page. This references the original post; it
 * never mirrors or hosts the video itself.
 *
 * A reliable thumbnail only exists for some platforms (see
 * lib/utils/social-embed.ts's header for exactly which, and why) — when
 * there isn't one, this shows a "Preview unavailable" state with the
 * platform's own brand icon rather than a generic broken-image look, and
 * always still links out to the real post.
 */
export function SocialContentStrip({ items }: { items: SocialContent[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center">
        <p className="font-body text-[13px] text-muted-2">No linked content yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const platform = detectSocialPlatform(item.permalink);
        const PlatformIcon = PLATFORM_ICON[platform];

        return (
          <a
            key={item.id}
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border border-border bg-surface"
          >
            <div className="relative aspect-square overflow-hidden bg-surface-muted">
              {item.thumbnailUrl ? (
                <>
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.caption || `${PLATFORM_LABEL[platform]} post`}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center bg-ink text-paper">
                    <PlatformIcon size={14} />
                  </span>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-2">
                  <PlatformIcon size={22} />
                  <span className="font-body text-[10px] uppercase tracking-[0.08em]">
                    Preview unavailable
                  </span>
                </div>
              )}
            </div>
            <p className="line-clamp-2 p-3 font-body text-[13px] text-ink">
              {item.caption || `View on ${PLATFORM_LABEL[platform]}`}
            </p>
          </a>
        );
      })}
    </div>
  );
}
