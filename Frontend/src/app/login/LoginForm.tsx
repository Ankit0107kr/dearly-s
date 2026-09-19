"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Field } from "@/components/ui/Field";
import { validateEmail, validateRequired } from "@/lib/validation";

export function LoginForm() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found = {
      email: validateEmail(email) ?? undefined,
      password: validateRequired("Password")(password) ?? undefined,
    };
    setFieldErrors(found);
    if (found.email || found.password) return;
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
        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            error={fieldErrors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
          />
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
