import {
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Award,
  ThumbsUp,
  Clock,
  Users,
  Wrench,
  Car,
  Heart,
  type LucideIcon,
} from "lucide-react";

/**
 * Fixed, curated icon set for Why Perkasa benefit cards — a select
 * dropdown in the admin, never a free-form image/SVG upload or icon
 * font picker. Keeps the CMS non-technical (per the project's core "CMS
 * controls content, code controls design" principle) while still giving
 * the founder a reasonable range of options for an automotive dealership
 * context. Shared between the admin form (dropdown) and the public
 * section (render) so there's exactly one source of truth for the
 * key<->icon mapping.
 */
export const BENEFIT_ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "shield-check", label: "Shield (Trust)", icon: ShieldCheck },
  { key: "badge-check", label: "Badge (Quality)", icon: BadgeCheck },
  { key: "sparkles", label: "Sparkles (Premium)", icon: Sparkles },
  { key: "award", label: "Award", icon: Award },
  { key: "thumbs-up", label: "Thumbs Up", icon: ThumbsUp },
  { key: "clock", label: "Clock (Speed/Service)", icon: Clock },
  { key: "users", label: "Users (Team/Support)", icon: Users },
  { key: "wrench", label: "Wrench (Maintenance)", icon: Wrench },
  { key: "car", label: "Car", icon: Car },
  { key: "heart", label: "Heart (Care)", icon: Heart },
];

/**
 * Plain object lookup, not a function call — deliberately, so call
 * sites resolve an icon via `BENEFIT_ICON_MAP[key] ?? DEFAULT_BENEFIT_ICON`
 * (an index expression) rather than calling a function that returns a
 * component. A component-returning function call assigned to a JSX-tag
 * variable trips the react-hooks "static components" rule inside any
 * component that also uses Hooks (it can't tell the call is a pure
 * lookup) — the same object-index shape already used without issue by
 * components/public/social-content-strip.tsx's PLATFORM_ICON.
 */
export const BENEFIT_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  BENEFIT_ICON_OPTIONS.map(({ key, icon }) => [key, icon])
);

/** Fallback for an unset/unrecognized icon key — a benefit card must never render with no icon at all. */
export const DEFAULT_BENEFIT_ICON: LucideIcon = Sparkles;
