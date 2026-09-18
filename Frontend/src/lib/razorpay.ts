import Razorpay from "razorpay";

/**
 * Razorpay is only instantiated when real keys are present. Without them the
 * app runs in demo mode: orders are simulated locally so the whole checkout
 * flow stays clickable before merchant keys are issued.
 */
export const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? "";
export const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

export const isRazorpayLive = Boolean(razorpayKeyId && razorpayKeySecret);

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay | null {
  if (!isRazorpayLive) return null;
  client ??= new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  return client;
}
