"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { orderApi, paymentApi } from "@/lib/api";
import type { ApiOrder } from "@/lib/api-types";
import { formatRupeesExact } from "@/lib/money";
import { Motif } from "@/components/ui/Motif";
import {
  loadRazorpayScript,
  openRazorpay,
  type RazorpaySuccess,
} from "@/lib/razorpay-client";
import { brand } from "@/data/site";

const PAID_STATES = new Set(["PAID", "REFUNDED"]);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-cream p-4">
      <p className="text-2xs tracking-wider text-ink-faint uppercase">{label}</p>
      <p className="mt-1 text-sm font-bold break-words">{value}</p>
    </div>
  );
}

function SuccessBody() {
  const orderId = useSearchParams().get("order");
  const [order, setOrder] = useState<ApiOrder | null>(null);
  // Derived, not set in an effect: with no reference there is nothing to fetch.
  const [state, setState] = useState<"loading" | "ready" | "missing">(
    orderId ? "loading" : "missing",
  );
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    orderApi
      .detail(orderId)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.order) {
          setOrder(res.data.order);
          setState("ready");
        } else {
          setState("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  // A payment abandoned at the gateway leaves the order PENDING; without this
  // the customer has no way back to it and the reservation simply expires.
  const completePayment = async () => {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const intent = (await paymentApi.create(order._id)).data;
      if (!intent?.providerConfigured) throw new Error("Payments are not configured yet.");
      if (!(await loadRazorpayScript())) throw new Error("Could not load the payment gateway.");

      openRazorpay({
        key: intent.keyId,
        amount: Math.round(intent.amount * 100),
        currency: intent.currency,
        name: brand.name,
        description: `Order ${order.orderNumber ?? order._id}`,
        order_id: intent.razorpayOrderId,
        prefill: {
          name: order.shippingAddress.fullName,
          contact: order.shippingAddress.phone,
        },
        theme: { color: "#7a5ad6" },
        modal: { ondismiss: () => setPaying(false) },
        handler: async (payload: RazorpaySuccess) => {
          try {
            await paymentApi.verify(payload);
            setReloadKey((k) => k + 1);
          } catch (e) {
            setError(e instanceof Error ? e.message : "We could not verify that payment.");
          } finally {
            setPaying(false);
          }
        },
      });
    } catch (e) {
      setPaying(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  if (state === "loading") {
    return <p className="py-[6vh] text-center text-sm text-ink-soft">Loading your order…</p>;
  }

  // No order reference: never imply that something was placed.
  if (state === "missing" || !order) {
    return (
      <div className="text-center">
        <Motif name="receipt" className="mx-auto size-14 text-ink-faint" strokeWidth={1.2} />
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em]">No order to show</h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-base text-ink-soft">
          This page shows an order confirmation right after checkout. Your past orders are always
          in your account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream">
            View my orders
          </Link>
          <Link href="/products" className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  const paid = PAID_STATES.has(order.paymentStatus);
  const reference = order.orderNumber ?? order._id;

  return (
    <div className="text-center">
      <Motif
        name={paid ? "celebrate" : "receipt"}
        className={`mx-auto size-16 ${paid ? "text-accent-600" : "text-ink-faint"}`}
        strokeWidth={1.2}
      />
      <h1 className="mt-5 text-5xl font-semibold tracking-[-0.03em] text-balance">
        {paid ? "Order confirmed" : "Order placed — payment pending"}
      </h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-base text-ink-soft text-pretty">
        {paid
          ? `Thank you, ${order.shippingAddress.fullName.split(" ")[0]}. A confirmation is on its way, and we will text tracking the moment it ships.`
          : "We have reserved your items but payment has not completed yet. Finish paying below and we will start packing."}
      </p>

      {!paid && (
        <div className="mx-auto mt-6 flex max-w-lg flex-col items-center gap-3">
          <button
            type="button"
            onClick={completePayment}
            disabled={paying}
            className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream disabled:opacity-60"
          >
            {paying ? "Opening Razorpay…" : `Complete payment of ${formatRupeesExact(order.totalAmount)}`}
          </button>
          {error && <p className="text-xs text-accent-700">{error}</p>}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-2xl text-left">
        <div className="grid gap-4 sm:grid-cols-3">
          <Row label="Order reference" value={reference} />
          <Row label="Status" value={`${order.paymentStatus} · ${order.orderStatus}`} />
          <Row label={paid ? "Paid" : "Amount due"} value={formatRupeesExact(order.totalAmount)} />
        </div>

        <ul className="mt-5 flex flex-col divide-y divide-line rounded-md border border-line">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm">
                {item.variantLabel ? `${item.productName} — ${item.variantLabel}` : item.productName}
                <span className="text-ink-faint"> × {item.quantity}</span>
              </span>
              <span className="text-sm font-bold">{formatRupeesExact(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-1 text-sm">
          {[
            ["Subtotal", order.subtotal],
            ...(order.discount ? [["Discount", -order.discount] as const] : []),
            ["Delivery", order.deliveryFee],
            ["Tax", order.tax ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between text-ink-soft">
              <dt>{label}</dt>
              <dd>{formatRupeesExact(value as number)}</dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatRupeesExact(order.totalAmount)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-ink-soft">
          Shipping to{" "}
          <strong className="text-ink">
            {[
              order.shippingAddress.addressLine1,
              order.shippingAddress.city,
              order.shippingAddress.state,
              order.shippingAddress.postalCode,
            ]
              .filter(Boolean)
              .join(", ")}
          </strong>
        </p>
      </div>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream shadow-soft">
          Keep shopping
        </Link>
        <Link href="/account" className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold">
          My orders
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="shell py-[6vh]">
      <div className="relative overflow-hidden rounded-xl border border-line bg-white p-[6vw] sm:p-[4vw]">
        <Suspense fallback={<p className="py-[6vh] text-center text-sm text-ink-soft">Loading…</p>}>
          <SuccessBody />
        </Suspense>
      </div>
    </div>
  );
}
