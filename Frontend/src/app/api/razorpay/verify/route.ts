import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { isRazorpayLive, razorpayKeySecret } from "@/lib/razorpay";

/**
 * Verifies the HMAC Razorpay returns with a successful payment. Anything that
 * does not match the expected signature is rejected outright.
 */
export async function POST(request: Request) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ verified: false, error: "Missing payment fields." }, { status: 400 });
  }

  if (!isRazorpayLive) {
    // Demo mode: nothing real was charged, so nothing real can be verified.
    return NextResponse.json({ verified: true, demo: true });
  }

  const expected = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

  const verified =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!verified) {
    return NextResponse.json({ verified: false, error: "Signature mismatch." }, { status: 400 });
  }

  return NextResponse.json({ verified: true, demo: false, paymentId: razorpay_payment_id });
}
