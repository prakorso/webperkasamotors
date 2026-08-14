import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin Login" };

/**
 * PHASE 2C: real Supabase Auth sign-in via LoginForm (client component).
 * Middleware already redirects an authenticated visitor away from this
 * page to /admin/dashboard, and redirects everyone else here — see
 * middleware.ts.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm border border-border bg-surface p-8">
        <p className="font-display text-headline-sm text-primary">Perkasa Motors</p>
        <p className="mb-8 font-body text-[11px] uppercase tracking-[0.1em] text-muted">
          Admin Console
        </p>

        <LoginForm />

        <p className="mt-6 border-t border-border pt-4 font-body text-[12px] text-muted-2">
          Access is by invitation — accounts are created by an administrator,
          not through self sign-up.
        </p>
      </div>
    </div>
  );
}
