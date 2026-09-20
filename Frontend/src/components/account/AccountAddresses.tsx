"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { userApi, type ApiAddress } from "@/lib/api";
import { lookupPincode } from "@/lib/pincode";
import { Field, fieldClass } from "@/components/ui/Field";
import {
  LIMITS,
  digitsOnly,
  lettersOnly,
  validateAll,
  validateName,
  validatePhone,
  validatePincode,
  validateRequired,
  type Validator,
} from "@/lib/validation";
import {
  EmptyState,
  ErrorNote,
  Panel,
  Skeleton,
} from "@/components/account/AccountUI";

const BLANK = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  addressType: "HOME",
};

type Draft = typeof BLANK;

const RULES: Partial<Record<keyof Draft, Validator>> = {
  fullName: validateName("Full name", LIMITS.fullNameMax),
  phone: validatePhone(),
  addressLine1: validateRequired("Address line 1", LIMITS.line1Max),
  postalCode: validatePincode,
  city: validateRequired("City", LIMITS.cityMax),
  state: validateRequired("State", LIMITS.cityMax),
  country: validateRequired("Country"),
};

export function AccountAddresses() {
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [pinState, setPinState] = useState<"idle" | "loading" | "found" | "notfound" | "failed">("idle");
  const pinAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userApi.addresses();
        if (!cancelled) setAddresses(res.data?.addresses ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load addresses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-read after a mutation; only ever called from an event handler.
  const load = useCallback(async () => {
    try {
      const res = await userApi.addresses();
      setAddresses(res.data?.addresses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load addresses");
    }
  }, []);

  const set = (key: keyof Draft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const blur = (key: keyof Draft) =>
    setErrors((e) => ({ ...e, [key]: RULES[key]?.(draft[key]) ?? undefined }));

  // Six digits is the whole pincode, so the lookup fires without a button.
  const onPincode = (raw: string) => {
    const value = digitsOnly(raw, 6);
    set("postalCode", value);
    pinAbort.current?.abort();
    setPinState("idle");
    if (value.length !== 6) return;

    const ctrl = new AbortController();
    pinAbort.current = ctrl;
    setPinState("loading");
    lookupPincode(value, ctrl.signal)
      .then((hit) => {
        if (ctrl.signal.aborted) return;
        if (!hit) return setPinState("notfound");
        setDraft((d) => ({ ...d, city: hit.city, state: hit.state }));
        setErrors((e) => ({ ...e, city: undefined, state: undefined }));
        setPinState("found");
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setPinState("failed");
      });
  };

  useEffect(() => () => pinAbort.current?.abort(), []);

  const closeForm = () => {
    setAdding(false);
    setDraft(BLANK);
    setErrors({});
    setPinState("idle");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAll(draft, RULES);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setError("");
    try {
      await userApi.addAddress(draft);
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the address");
    } finally {
      setSubmitting(false);
    }
  };

  const makeDefault = async (id: string) => {
    setBusyId(id);
    try {
      await userApi.setDefaultAddress(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set the default");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setBusyId(id);
    try {
      await userApi.deleteAddress(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the address");
    } finally {
      setBusyId(null);
    }
  };

  const pinNote = {
    idle: undefined,
    loading: "Looking up…",
    found: "City and state filled from the pincode",
    notfound: "No record for that pincode — enter city and state yourself",
    failed: "Lookup unavailable — enter city and state yourself",
  }[pinState];

  return (
    <Panel
      title="Addresses"
      description="Saved delivery addresses. The default is used first at checkout."
      action={
        <button
          type="button"
          onClick={() => (adding ? closeForm() : setAdding(true))}
          className="inline-flex items-center gap-1.5 rounded-xs gradient-accent px-4 py-2 text-xs font-bold text-cream"
        >
          {adding ? "Close" : <><Plus className="size-3.5" strokeWidth={2.2} aria-hidden />Add new address</>}
        </button>
      }
    >
      <div className="grid gap-4">
        {error && <ErrorNote>{error}</ErrorNote>}

        {adding && (
          <form
            onSubmit={create}
            noValidate
            className="animate-rise grid gap-3 rounded-md border border-line bg-cream p-5 sm:grid-cols-2"
          >
            <Field
              label="Full name"
              value={draft.fullName}
              error={errors.fullName}
              onChange={(e) => set("fullName", lettersOnly(e.target.value))}
              onBlur={() => blur("fullName")}
            />
            <Field
              label="Phone"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              value={draft.phone}
              error={errors.phone}
              onChange={(e) => set("phone", digitsOnly(e.target.value, 10))}
              onBlur={() => blur("phone")}
            />
            <Field
              label="Address line 1"
              className="sm:col-span-2"
              value={draft.addressLine1}
              error={errors.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
              onBlur={() => blur("addressLine1")}
            />
            <Field
              label="Address line 2"
              optional
              className="sm:col-span-2"
              value={draft.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
            />
            <Field
              label="Landmark"
              optional
              value={draft.landmark}
              onChange={(e) => set("landmark", e.target.value)}
            />
            <Field
              label="Pincode"
              inputMode="numeric"
              placeholder="6 digits"
              value={draft.postalCode}
              error={errors.postalCode}
              hint={pinNote}
              onChange={(e) => onPincode(e.target.value)}
              onBlur={() => blur("postalCode")}
            />
            <Field
              label="City"
              value={draft.city}
              error={errors.city}
              onChange={(e) => set("city", e.target.value)}
              onBlur={() => blur("city")}
            />
            <Field
              label="State"
              value={draft.state}
              error={errors.state}
              onChange={(e) => set("state", e.target.value)}
              onBlur={() => blur("state")}
            />
            <Field
              label="Country"
              value={draft.country}
              error={errors.country}
              onChange={(e) => set("country", lettersOnly(e.target.value))}
              onBlur={() => blur("country")}
            />
            <label className="block text-sm">
              <span className="font-medium">Type</span>
              <select
                value={draft.addressType}
                onChange={(e) => set("addressType", e.target.value)}
                className={fieldClass(false)}
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={submitting || pinState === "loading"}
                className="inline-flex items-center gap-2 rounded-xs gradient-accent px-5 py-2.5 text-xs font-bold text-cream disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                {submitting ? "Saving…" : "Save address"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <Skeleton rows={2} />
        ) : addresses.length === 0 && !adding ? (
          <EmptyState
            icon={<MapPin className="size-5" strokeWidth={1.5} />}
            title="No addresses saved"
            body="Add a delivery address now and checkout will be a step shorter."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <article
                key={a._id}
                className={`rounded-md border p-4 transition-colors duration-300 ${
                  a.isDefault ? "border-accent-300 bg-accent-50/50" : "border-line bg-cream"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{a.fullName}</p>
                  {a.isDefault && (
                    <span className="shrink-0 rounded-xs bg-accent-600 px-2 py-0.5 text-2xs font-bold text-cream">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {a.addressLine1}
                  {a.addressLine2 && <>, {a.addressLine2}</>}
                  {a.landmark && <>, {a.landmark}</>}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                  <br />
                  {a.country}
                </p>
                <p className="mt-1 text-xs text-ink-faint">{a.phone}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(a._id)}
                      disabled={busyId === a._id}
                      className="inline-flex items-center gap-1.5 rounded-xs border border-ink/15 bg-white px-3 py-1.5 text-2xs font-semibold transition hover:border-accent-600 hover:text-accent-700 disabled:opacity-50"
                    >
                      <Star className="size-3" strokeWidth={1.6} aria-hidden />
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(a._id)}
                    disabled={busyId === a._id}
                    className="inline-flex items-center gap-1.5 rounded-xs border border-ink/15 bg-white px-3 py-1.5 text-2xs font-semibold transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="size-3" strokeWidth={1.6} aria-hidden />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
