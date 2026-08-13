import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const metadata: Metadata = { title: "Admin Login" };

/**
 * PLACEHOLDER — visual shell only. There is no Supabase Auth wired up
 * yet, so this form does not authenticate anyone; it links straight
 * through to /admin/dashboard to let the rest of the shell be reviewed.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm border border-border bg-surface p-8">
        <p className="font-display text-headline-sm text-primary">Perkasa Motors</p>
        <p className="mb-8 font-body text-[11px] uppercase tracking-[0.1em] text-muted">
          Admin Console
        </p>

        <form className="flex flex-col gap-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="you@perkasamotors.com" />
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" placeholder="••••••••" />
          </div>
          <Link
            href="/admin/dashboard"
            className={buttonVariants({ variant: "primary", size: "lg", className: "mt-2 w-full" })}
          >
            Sign In
          </Link>
        </form>

        <p className="mt-6 border-t border-border pt-4 font-body text-[12px] text-muted-2">
          PLACEHOLDER — no authentication is wired up yet. Signing in leads
          straight to the dashboard shell.
        </p>
      </div>
    </div>
  );
}
