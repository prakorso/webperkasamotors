"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Real Supabase Auth sign-in. Runs in the browser (not a Server Action) so
 * @supabase/ssr can write the session cookie via document.cookie — the
 * server-side pieces (middleware.ts, the shell layout) then read that same
 * cookie on the next request.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setError("Email atau password salah.");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@perkasamotors.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        // No dedicated "danger" token exists in app/globals.css (only
        // success/warning/info) — reusing the brand's red primary for
        // error text rather than introducing a new token for one message.
        <p role="alert" className="font-body text-[13px] text-primary">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
