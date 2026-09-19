import { NextResponse } from "next/server";
import { getRazorpay, isRazorpayLive, razorpayKeyId } from "@/lib/razorpay";
import { productById } from "@/data/products";
import { coupons, freeShippingThreshold, shippingMethods, taxRate } from "@/data/site";

type IncomingLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  /** Paise; used when `productId` is not in the static catalog (API products). */
  unitPrice?: number;
};

/**
 * The client never sends a price. The amount is recomputed here from the
 * server-side catalog so a tampered cart cannot change what is charged.
 */
function priceOrder(lines: IncomingLine[], couponCode?: string, shippingMethodId?: string) {
  let subtotal = 0;
  for (const line of lines) {
    const quantity = Math.max(1, Math.min(Math.trunc(line.quantity), 99));
    const product = productById.get(line.productId);
    let unitPrice = line.unitPrice;
    if (product) {
      const variant = product.variants?.find((v) => v.id === line.variantId);
      unitPrice = product.price + (variant?.priceDelta ?? 0);
    }
    if (unitPrice == null || unitPrice < 0) continue;
    subtotal += unitPrice * quantity;
  }

  const coupon = couponCode ? coupons[couponCode.toUpperCase()] : undefined;
  const discount = !coupon
    ? 0
    : coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  const method = shippingMethods.find((s) => s.id === shippingMethodId) ?? shippingMethods[0];
  const shipping = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : method.price;

  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * taxRate);

  return { subtotal, discount, shipping, tax, total: taxable + shipping + tax };
}

export async function POST(request: Request) {
  let body: { lines?: IncomingLine[]; couponCode?: string; shippingMethodId?: string; receipt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  const summary = priceOrder(lines, body.couponCode, body.shippingMethodId);
  if (summary.total <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });
  }

  const receipt = body.receipt ?? `gifty_${Date.now()}`;

  // Demo mode — no merchant keys configured yet.
  if (!isRazorpayLive) {
    return NextResponse.json({
      demo: true,
      orderId: `order_demo_${Date.now()}`,
      amount: summary.total,
      currency: "INR",
      keyId: null,
      receipt,
      summary,
    });
  }

  try {
    const order = await getRazorpay()!.orders.create({
      amount: summary.total, // already in paise
      currency: "INR",
      receipt,
      notes: { source: "gifty-web" },
    });

    return NextResponse.json({
      demo: false,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: razorpayKeyId,
      receipt,
      summary,
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return NextResponse.json(
      { error: "Could not reach the payment gateway. Please try again." },
      { status: 502 },
    );
  }
}
