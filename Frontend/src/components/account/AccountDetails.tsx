"use client";

import { useState } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ErrorNote, Panel } from "@/components/account/AccountUI";
import { Field } from "@/components/ui/Field";
import {
  lettersOnly,
  phoneDigitsOnly,
  validateAll,
  validateName,
  validatePhone,
} from "@/lib/validation";


export function AccountDetails() {
  const { user, refresh } = useAuth();

  // `/auth/me` carries every editable field and AccountShell renders tabs only
  // once `user` resolved, so this tab fetches nothing and needs no sync effect.
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
    setSaved(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAll(form, {
      firstName: validateName("First name"),
      lastName: validateName("Last name"),
      phone: validatePhone(false),
    }) as Record<string, string>;
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await userApi.updateProfile(form);
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Panel
        title="Profile details"
        description="Your name and phone are used on orders and delivery updates."
      >
        <form onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
          <Field
            label="First name"
            value={form.firstName}
            error={errors.firstName}
            onChange={(e) => set("firstName", lettersOnly(e.target.value))}
          />
          <Field
            label="Last name"
            value={form.lastName}
            error={errors.lastName}
            onChange={(e) => set("lastName", lettersOnly(e.target.value))}
          />
          <Field
            label="Phone"
            optional
            inputMode="numeric"
            placeholder="10-digit mobile"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => set("phone", phoneDigitsOnly(e.target.value))}
          />
          <Field label="Email" disabled value={user?.email ?? ""} hint="Cannot be changed" />

          {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xs gradient-accent px-5 py-2.5 text-xs font-bold text-cream disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="animate-fade text-xs font-semibold text-green-700">
                Saved
              </span>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-faint">Account type</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {user?.role === "ADMIN" ? "Administrator" : "Customer"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Email</dt>
            <dd className="mt-0.5 truncate font-medium text-ink">{user?.email}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
