import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout with Razorpay — UPI, cards, netbanking and wallets.",
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
