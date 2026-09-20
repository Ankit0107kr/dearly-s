import { cartApi, orderApi, userApi } from "@/lib/api";
import type { ApiOrder, ApiPaymentIntent, DeliveryType } from "@/lib/api-types";
import type { Address, CartLineView } from "@/lib/types";

/** Checkout's shipping choices map onto the backend's delivery types. */
const DELIVERY_BY_SHIPPING: Record<string, DeliveryType> = {
  "ship-standard": "STANDARD",
  "ship-express": "EXPRESS",
  "ship-timed": "SCHEDULED",
};

export const toDeliveryType = (shippingMethodId?: string): DeliveryType =>
  DELIVERY_BY_SHIPPING[shippingMethodId ?? ""] ?? "STANDARD";

/**
 * Replays the browser cart onto the server cart. The client sends what was
 * chosen — product, variant, quantity — and never a price; the server prices
 * the order from its own catalogue when it builds it.
 */
async function pushCart(lines: CartLineView[]) {
  await cartApi.clear();
  for (const line of lines) {
    await cartApi.addItem({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
    });
  }
}

async function createAddress(address: Address) {
  const res = await userApi.addAddress({
    fullName: address.fullName,
    phone: address.phone.replace(/\s/g, ""),
    addressLine1: address.line1,
    ...(address.line2 ? { addressLine2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    postalCode: address.pincode,
    country: "India",
  });

  const created = res.data?.address;
  if (!created) throw new Error("Could not save that delivery address.");
  return created;
}

export type PlacedOrderResult = { order: ApiOrder; payment: ApiPaymentIntent };

/**
 * One idempotency key per checkout attempt: a retried request returns the
 * original order instead of placing and reserving stock for a second one.
 */
export function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ck_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function placeOrder({
  lines,
  address,
  couponCode,
  shippingMethodId,
  deliveryDate,
  deliverySlot,
  idempotencyKey,
}: {
  lines: CartLineView[];
  address: Address;
  couponCode?: string | null;
  shippingMethodId?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  idempotencyKey: string;
}): Promise<PlacedOrderResult> {
  await pushCart(lines);
  const saved = await createAddress(address);

  const res = await orderApi.create(
    {
      addressId: saved._id,
      ...(couponCode ? { couponCode } : {}),
      deliveryType: toDeliveryType(shippingMethodId),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(deliverySlot ? { deliverySlot } : {}),
    },
    idempotencyKey,
  );

  if (!res.data?.order) throw new Error(res.message || "Could not place the order.");
  return { order: res.data.order, payment: res.data.payment };
}
