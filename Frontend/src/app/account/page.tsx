import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "My account",
  description: "Your orders, addresses, wishlist and profile details.",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="shell grid min-h-[60vh] place-items-center text-sm text-ink-soft">
          Loading your account…
        </div>
      }
    >
      <AccountShell />
    </Suspense>
  );
}
