"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { useLastOrder } from "@/lib/useLastOrder";
import { Motif } from "@/components/ui/Motif";

export default function OrderSuccessPage() {
  const order = useLastOrder();

  return (
    <div className="shell py-[6vh]">
      <div className="relative overflow-hidden rounded-xl border border-line bg-white p-[6vw] text-center sm:p-[4vw]">
        <div className="relative">
          <Motif name="celebrate" className="mx-auto size-16 text-accent-600" strokeWidth={1.2} />
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.03em] text-balance">
            Order placed
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-base text-ink-soft text-pretty">
            {order
              ? `Thank you, ${order.fullName.split(" ")[0]}. A confirmation is on its way to ${order.email}, and we will text tracking the moment it ships.`
              : "Thank you. A confirmation email is on its way, and we will text tracking the moment it ships."}
          </p>

          {order?.demo && (
            <p className="mx-auto mt-5 max-w-[56ch] rounded-md border border-accent-400/50 bg-accent-100 px-5 py-3 text-xs text-ink-soft">
              Demo mode — no payment was actually taken. Add <code>RAZORPAY_KEY_ID</code> and{" "}
              <code>RAZORPAY_KEY_SECRET</code> to <code>.env.local</code> to charge for real.
            </p>
          )}

          {order && (
            <div className="mx-auto mt-8 max-w-2xl text-left">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Order reference", order.reference],
                  ["Delivery", `${order.shippingLabel} · ${order.eta}`],
                  ["Paid", formatMoney(order.total)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-line bg-cream p-4">
                    <p className="text-2xs tracking-wider text-ink-faint uppercase">{label}</p>
                    <p className="mt-1 text-sm font-bold break-words">{value}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-5 flex flex-col divide-y divide-line rounded-md border border-line">
                {order.items.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-4 p-4">
                    <span className="text-sm">
                      {item.name}
                      <span className="text-ink-faint"> × {item.quantity}</span>
                    </span>
                    <span className="text-sm font-bold">{formatMoney(item.total)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-ink-soft">
                Shipping to <strong className="text-ink">{order.address}</strong>
              </p>
            </div>
          )}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-white shadow-soft"
            >
              Keep shopping
            </Link>
            <Link href="/" className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
