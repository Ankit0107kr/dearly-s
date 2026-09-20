"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminOrder } from "@/lib/api";
import { formatInr, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/admin-constants";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    orderStatus: "",
    paymentStatus: "",
    fromDate: "",
    toDate: "",
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const buildQuery = useCallback((pageNum = page) => {
    const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
    if (filters.orderStatus) params.set("orderStatus", filters.orderStatus);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);
    return params.toString();
  }, [page, filters]);

  const load = useCallback(async (pageNum?: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.orders(buildQuery(pageNum));
      setOrders(res.data?.items ?? []);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(1);
  };

  const changeStatus = async (id: string, orderStatus: string) => {
    setUpdatingId(id);
    try {
      await adminApi.updateOrderStatus(id, orderStatus);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <form
        onSubmit={applyFilters}
        className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <select
          value={filters.orderStatus}
          onChange={(e) => setFilters((f) => ({ ...f, orderStatus: e.target.value }))}
          className="rounded-md border border-line px-3 py-2 text-sm"
        >
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          className="rounded-md border border-line px-3 py-2 text-sm"
        >
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
          className="rounded-md border border-line px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
          className="rounded-md border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-cream"
        >
          Apply filters
        </button>
      </form>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-2xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Order status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-soft">Loading…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-soft">No orders match your filters.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b border-line/70">
                  <td className="px-4 py-3 text-xs">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p>{o.shippingAddress?.fullName || `${o.userId?.firstName ?? ""} ${o.userId?.lastName ?? ""}`}</p>
                    <p className="text-xs text-ink-faint">{o.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3">{formatInr(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs">{o.paymentStatus}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.orderStatus}
                      disabled={updatingId === o._id}
                      onChange={(e) => changeStatus(o._id, e.target.value)}
                      className="max-w-[180px] rounded border border-line px-2 py-1 text-xs"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded border border-line px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-ink-soft">Page {page} of {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border border-line px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
