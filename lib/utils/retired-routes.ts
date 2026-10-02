/**
 * Pages retired from the public experience (Post-release simplification R1):
 * their content now lives on the homepage and the routes redirect there
 * (next.config.ts). Shared by the public navigation rules (which hide such
 * links) and the admin menu manager (which flags them), so both agree.
 */
export const RETIRED_PUBLIC_HREFS = ["/about", "/financing", "/contact"] as const;

export function isRetiredPublicHref(href: string): boolean {
  return RETIRED_PUBLIC_HREFS.some((retired) => href === retired || href.startsWith(`${retired}/`));
}
