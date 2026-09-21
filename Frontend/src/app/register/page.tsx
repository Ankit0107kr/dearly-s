"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GoogleSignInSection } from "@/components/auth/GoogleSignInSection";
import { useAuth } from "@/lib/auth";
import { Field } from "@/components/ui/Field";
import {
  phoneDigitsOnly,
  lettersOnly,
  passwordStrength,
  validateAll,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  type Validator,
} from "@/lib/validation";

const BLANK = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

type Form = typeof BLANK;

const STRENGTH = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-16 text-center text-sm text-ink-soft">Loading…</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [form, setForm] = useState<Form>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const rules: Partial<Record<keyof Form, Validator>> = {
    firstName: validateName("First name"),
    lastName: validateName("Last name"),
    email: validateEmail,
    phone: validatePhone(false),
    password: validatePassword,
    confirmPassword: validateConfirmPassword(form.password),
  };

  const set = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (touched[key]) setErrors((e) => ({ ...e, [key]: rules[key]?.(value) ?? undefined }));
  };

  const blur = (key: keyof Form) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: rules[key]?.(form[key]) ?? undefined }));
  };

  const onGoogle = async (credential: string) => {
    setError("");
    setGoogleBusy(true);
    try {
      await loginWithGoogle(credential);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found = validateAll(form, rules);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(BLANK).map((k) => [k, true])));
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-lg border border-line bg-cream p-8 shadow-soft">
        <h1 className="font-display text-2xl text-ink">Create account</h1>
        <div className="mt-6 flex flex-col gap-3">
          <GoogleSignInSection
            onCredential={onGoogle}
            onError={setError}
            disabled={submitting || googleBusy}
          />
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First name"
              autoComplete="given-name"
              value={form.firstName}
              error={errors.firstName}
              onChange={(e) => set("firstName", lettersOnly(e.target.value))}
              onBlur={() => blur("firstName")}
            />
            <Field
              label="Last name"
              autoComplete="family-name"
              value={form.lastName}
              error={errors.lastName}
              onChange={(e) => set("lastName", lettersOnly(e.target.value))}
              onBlur={() => blur("lastName")}
            />
          </div>
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => blur("email")}
          />
          <Field
            label="Phone"
            optional
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => set("phone", phoneDigitsOnly(e.target.value))}
            onBlur={() => blur("phone")}
          />
          <div>
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              error={errors.password}
              hint="8+ characters with upper, lower, a number and a symbol"
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => blur("password")}
            />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i <= strength
                          ? strength <= 2
                            ? "bg-red-400"
                            : strength <= 4
                              ? "bg-amber-400"
                              : "bg-green-500"
                          : "bg-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-2xs text-ink-faint">{STRENGTH[strength]}</span>
              </div>
            )}
          </div>
          <Field
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            onBlur={() => blur("confirmPassword")}
          />
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || googleBusy}
            className="mt-1 rounded-md gradient-accent px-4 py-2.5 text-sm font-bold text-cream disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Register"}
          </button>
        </form>
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link
            href={
              next === "/"
                ? "/login"
                : `/login?next=${encodeURIComponent(next)}`
            }
            className="font-semibold text-accent-700 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
