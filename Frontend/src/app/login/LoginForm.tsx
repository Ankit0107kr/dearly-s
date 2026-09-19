"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginForm() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim().toLowerCase(), password);
      if (loggedIn.role === "ADMIN" && (next === "/" || next.startsWith("/admin"))) {
        router.replace(next.startsWith("/admin") ? next : "/admin");
      } else {
        router.replace(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const dest = user.role === "ADMIN" ? "/admin" : next;
    router.replace(dest);
  }, [authLoading, user, next, router]);

  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-cream p-8 shadow-soft">
        <h1 className="font-display text-2xl text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Customers and admins use the same login. Admins are redirected to the portal.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md gradient-accent px-4 py-2.5 text-sm font-bold text-cream disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link href="/register" className="font-semibold text-accent-700 underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
