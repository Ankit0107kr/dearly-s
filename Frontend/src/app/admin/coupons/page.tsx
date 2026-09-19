"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminCoupon } from "@/lib/api";
import { decimalOnly, digitsOnly, validateAll, validateAmount, validateInteger, validateRequired } from "@/lib/validation";
import { DISCOUNT_TYPES, formatInr } from "@/lib/admin-constants";

const defaultForm = {
  code: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
  discountValue: "",
  minimumAmount: "0",
  maximumDiscount: "",
  startDate: "",
  expiryDate: "",
  usageLimit: "",
};

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.coupons();
      setCoupons(res.data?.coupons ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      ...defaultForm,
      startDate: toInputDate(new Date()),
      expiryDate: toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    });
    setEditingId(null);
  };

  useEffect(() => {
    resetForm();
  }, []);

  const startEdit = (c: AdminCoupon) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minimumAmount: String(c.minimumAmount ?? 0),
      maximumDiscount: c.maximumDiscount != null ? String(c.maximumDiscount) : "",
      startDate: toInputDate(new Date(c.startDate)),
      expiryDate: toInputDate(new Date(c.expiryDate)),
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
    });
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minimumAmount: Number(form.minimumAmount) || 0,
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      isActive: true,
    };
    if (form.maximumDiscount) payload.maximumDiscount = Number(form.maximumDiscount);
    if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
    return payload;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const isPercent = form.discountType === "PERCENTAGE";
    const found = validateAll(
      {
        code: form.code,
        discountValue: form.discountValue,
        minimumAmount: form.minimumAmount,
        maximumDiscount: form.maximumDiscount,
        usageLimit: form.usageLimit,
        startDate: form.startDate,
        expiryDate: form.expiryDate,
      },
      {
        code: validateRequired("Code", 40),
        discountValue: validateAmount("Discount value", {
          min: 1,
          max: isPercent ? 100 : 100000,
        }),
        minimumAmount: validateAmount("Minimum amount", { min: 0, required: false }),
        maximumDiscount: validateAmount("Maximum discount", { min: 0, required: false }),
        usageLimit: validateInteger("Usage limit", { min: 1, required: false }),
        startDate: validateRequired("Start date"),
        expiryDate: validateRequired("Expiry date"),
      },
    ) as Record<string, string>;
    if (form.startDate && form.expiryDate && form.expiryDate <= form.startDate) {
      found.expiryDate = "Expiry must be after the start date";
    }
    setFieldErrors(found);
    if (Object.keys(found).length) {
      setError("Fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await adminApi.updateCoupon(editingId, payload);
        setMessage("Coupon updated.");
      } else {
        await adminApi.createCoupon(payload);
        setMessage("Coupon created.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this coupon?")) return;
    try {
      await adminApi.deleteCoupon(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate");
    }
  };

  const labelDiscount = (c: AdminCoupon) =>
    c.discountType === "PERCENTAGE"
      ? `${c.discountValue}%`
      : formatInr(c.discountValue);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1.2fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold">{editingId ? "Edit coupon" : "New coupon"}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Percentage discounts can use an optional maximum cap (INR).
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <input
            required
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="rounded-md border border-line px-3 py-2 text-sm uppercase"
          />
          <select
            value={form.discountType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                discountType: e.target.value as "PERCENTAGE" | "FLAT",
              }))
            }
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            {DISCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "PERCENTAGE" ? "Percentage (%)" : "Flat amount (INR)"}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={0}
            placeholder={form.discountType === "PERCENTAGE" ? "Percent off" : "Flat off (INR)"}
            value={form.discountValue}
            onChange={(e) => setForm((f) => ({ ...f, discountValue: decimalOnly(e.target.value) }))}
            className="rounded-md border border-line px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              placeholder="Min cart (INR)"
              value={form.minimumAmount}
              onChange={(e) => setForm((f) => ({ ...f, minimumAmount: decimalOnly(e.target.value) }))}
              className="rounded-md border border-line px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              placeholder="Max discount (INR, optional)"
              value={form.maximumDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maximumDiscount: decimalOnly(e.target.value) }))}
              className="rounded-md border border-line px-3 py-2 text-sm"
              disabled={form.discountType === "FLAT"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Start
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              Expiry
              <input
                required
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
          </div>
          <input
            type="number"
            min={1}
            placeholder="Usage limit (optional)"
            value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: digitsOnly(e.target.value) }))}
            className="rounded-md border border-line px-3 py-2 text-sm"
          />
          {message && <p className="text-sm text-accent-700">{message}</p>}
          {Object.values(fieldErrors).filter(Boolean).length > 0 && (
            <ul className="grid gap-1 text-xs text-red-700" role="alert">
              {Object.values(fieldErrors).filter(Boolean).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md gradient-accent px-4 py-2 text-sm font-bold text-cream disabled:opacity-60"
            >
              {submitting ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-line px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold">All coupons</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink-soft">Loading…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-2xs text-ink-faint uppercase">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Discount</th>
                  <th className="py-2 pr-3">Validity</th>
                  <th className="py-2 pr-3">Uses</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-b border-line/60">
                    <td className="py-3 pr-3 font-mono font-medium">{c.code}</td>
                    <td className="py-3 pr-3">{labelDiscount(c)}</td>
                    <td className="py-3 pr-3 text-xs text-ink-soft">
                      {toInputDate(new Date(c.startDate))} → {toInputDate(new Date(c.expiryDate))}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {c.usedCount ?? 0}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="py-3 text-right">
                      {c.isActive ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="text-xs font-semibold underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deactivate(c._id)}
                            className="text-xs font-semibold text-accent-700 underline"
                          >
                            Deactivate
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
