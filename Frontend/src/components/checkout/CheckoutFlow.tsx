"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { brand, shippingMethods } from "@/data/site";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import {
  loadRazorpayScript,
  openRazorpay,
  type RazorpaySuccess,
} from "@/lib/razorpay-client";
import {
  checkoutAddressFromSaved,
  newIdempotencyKey,
  placeOrder,
  toDeliveryType,
} from "@/lib/checkout";
import { paymentApi, userApi, type ApiAddress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Address } from "@/lib/types";
import { lookupPincode } from "@/lib/pincode";
import {
  digitsOnly,
  phoneDigitsOnly,
  lettersOnly,
  validateAll,
  validateEmail,
  validateName,
  validatePhone,
  validatePincode,
  validateRequired,
  type Validator,
} from "@/lib/validation";
import { Motif } from "@/components/ui/Motif";

const steps = ["Details", "Delivery", "Payment"] as const;
type Step = (typeof steps)[number];

const CHECKOUT_PATH = "/checkout";

const DELIVERY_SLOTS = ["09:00 – 13:00", "13:00 – 17:00", "17:00 – 21:00"] as const;

/** Scheduled delivery needs a date; the backend rejects anything in the past. */
const earliestDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const emptyAddress: Address = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

function Field({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-2xs font-bold tracking-[0.12em] text-ink-soft uppercase">{label}</span>
      <input
        {...props}
        className={`rounded-md border bg-white px-4 py-3 text-sm outline-none transition ${
          error ? "border-accent-600" : "border-ink/12 focus:border-ink"
        }`}
      />
      {error && <span className="text-2xs text-accent-600">{error}</span>}
    </label>
  );
}

const DETAIL_RULES: Record<string, Validator> = {
  fullName: validateName("Full name"),
  email: validateEmail,
  phone: validatePhone(),
  line1: validateRequired("Street address"),
  city: validateRequired("City"),
  state: validateRequired("State"),
  pincode: validatePincode,
};

export function CheckoutFlow() {
  const router = useRouter();
  const { lines, summary, couponCode, shippingMethodId, setShipping, clear, hydrated } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("Details");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState<ApiAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [paying, setPaying] = useState(false);
  const pinAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setStep("Details");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    userApi
      .addresses()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.addresses ?? [];
        setSavedAddresses(list);
        const chosen = list.find((a) => a.isDefault) ?? list[0];
        if (chosen) {
          setSelectedAddressId(chosen._id);
          setAddress(checkoutAddressFromSaved(chosen, user.email));
        } else {
          setSelectedAddressId("new");
          setAddress({
            ...emptyAddress,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
            email: user.email,
            phone: user.phone ?? "",
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedAddressId("new");
        setAddress((a) => ({
          ...a,
          fullName: a.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
          email: a.email || user.email,
          phone: a.phone || user.phone || "",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => () => pinAbort.current?.abort(), []);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState<string>(DELIVERY_SLOTS[0]);

  const method = useMemo(
    () => shippingMethods.find((s) => s.id === shippingMethodId) ?? shippingMethods[0],
    [shippingMethodId],
  );
  const requiresSchedule = toDeliveryType(shippingMethodId) === "SCHEDULED";

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const value =
      key === "fullName" ? lettersOnly(raw)
      : key === "phone" ? phoneDigitsOnly(raw)
      : raw;
    setAddress((a) => ({ ...a, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Six digits is the whole pincode, so the lookup fires without a button.
  const onPincode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = digitsOnly(e.target.value, 6);
    setAddress((a) => ({ ...a, pincode: value }));
    setErrors((prev) => ({ ...prev, pincode: undefined }));
    pinAbort.current?.abort();
    if (value.length !== 6) return;
    const ctrl = new AbortController();
    pinAbort.current = ctrl;
    lookupPincode(value, ctrl.signal)
      .then((hit) => {
        if (!hit || ctrl.signal.aborted) return;
        setAddress((a) => ({ ...a, city: hit.city, state: hit.state }));
        setErrors((prev) => ({ ...prev, city: undefined, state: undefined }));
      })
      .catch(() => {
        /* third-party lookup — the customer can still type city and state */
      });
  };

  const usingSaved = selectedAddressId !== "new";

  const pickSaved = (saved: ApiAddress) => {
    setSelectedAddressId(saved._id);
    setAddress(checkoutAddressFromSaved(saved, user?.email ?? address.email));
    setErrors({});
  };

  const startNewAddress = () => {
    setSelectedAddressId("new");
    setAddress({
      ...emptyAddress,
      fullName: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
    setErrors({});
  };

  const validateDetails = () => {
    const rules = usingSaved ? { email: validateEmail } : DETAIL_RULES;
    const next = validateAll(address as unknown as Record<string, string>, rules);
    setErrors(next as Partial<Record<keyof Address, string>>);
    return Object.keys(next).length === 0;
  };

  const detailsComplete =
    Object.keys(
      validateAll(
        address as unknown as Record<string, string>,
        usingSaved ? { email: validateEmail } : DETAIL_RULES,
      ),
    ).length === 0;

  const pay = async () => {
    if (!user) return;

    setPaying(true);
    setPaymentError(null);

    try {
      // The server reprices the cart from its own catalogue and returns the
      // authoritative total; nothing the browser computed is trusted here.
      const { order, payment } = await placeOrder({
        lines,
        address,
        ...(usingSaved ? { addressId: selectedAddressId } : {}),
        couponCode,
        shippingMethodId,
        ...(requiresSchedule ? { deliveryDate, deliverySlot } : {}),
        idempotencyKey: newIdempotencyKey(),
      });

      const reference = order.orderNumber ?? order._id;

      // No merchant keys yet: the order exists and waits on payment.
      if (!payment || !payment.providerConfigured) {
        clear();
        router.push(`/checkout/success?order=${order._id}`);
        return;
      }

      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Could not load the payment gateway. Check your connection.");

      openRazorpay({
        key: payment.keyId,
        amount: Math.round(payment.amount * 100),
        currency: payment.currency,
        name: brand.name,
        description: `Order ${reference}`,
        order_id: payment.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        notes: { orderNumber: reference },
        theme: { color: "#7a5ad6" },
        modal: { ondismiss: () => setPaying(false) },
        handler: async (payload: RazorpaySuccess) => {
          try {
            // Verified server-side: the signature is checked against the key
            // secret, which never reaches the browser.
            await paymentApi.verify(payload);
            clear();
            router.push(`/checkout/success?order=${order._id}`);
          } catch (error) {
            setPaying(false);
            setPaymentError(
              error instanceof Error
                ? `${error.message} If you were charged, the payment will be confirmed automatically.`
                : "Payment verification failed.",
            );
          }
        },
      });
    } catch (error) {
      setPaying(false);
      setPaymentError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const signInNext = encodeURIComponent(CHECKOUT_PATH);
  const showSignInGate = !authLoading && !user;

  if (hydrated && lines.length === 0) {
    return (
      <div className="shell flex flex-col items-center gap-5 py-[14vh] text-center">
        <Motif name="receipt" className="size-16 text-ink-faint" strokeWidth={1} />
        <h1 className="text-4xl font-semibold tracking-tight">Nothing to check out</h1>
        <p className="max-w-[44ch] text-base text-ink-soft">
          Your bag is empty, so there is no order to place yet.
        </p>
        <Link
          href="/products"
          className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-white shadow-soft"
        >
          Find a gift
        </Link>
      </div>
    );
  }

  return (
    <div className="shell py-[5vh]">
      <h1 className="text-5xl font-semibold tracking-[-0.03em]">Checkout</h1>

      {/* stepper */}
      <ol className="mt-8 flex flex-wrap items-center gap-3">
        {steps.map((s, i) => {
          const currentIndex = steps.indexOf(step);
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
          return (
            <li key={s} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => i < currentIndex && setStep(s)}
                disabled={i > currentIndex}
                className={`flex items-center gap-2 rounded-xs px-5 py-3 text-xs font-bold transition ${
                  state === "active"
                    ? "bg-ink text-cream"
                    : state === "done"
                      ? "bg-accent-100 text-accent-700"
                      : "border border-ink/12 text-ink-faint"
                }`}
              >
                <span className="grid size-5 place-items-center rounded-full bg-current/15 text-2xs">
                  {state === "done" ? <Motif name="check" className="size-3" strokeWidth={2.4} /> : i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && <span className="text-ink-faint">—</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-[4vh] grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
          {authLoading && (
            <p className="text-sm text-ink-soft">Checking your account…</p>
          )}

          {showSignInGate && (
            <div className="animate-fade flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Sign in to continue</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Checkout is tied to your account so we can save your address and order history.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/login?next=${signInNext}`}
                  className="rounded-xs gradient-accent px-8 py-4 text-center text-sm font-bold text-cream"
                >
                  Sign in
                </Link>
                <Link
                  href={`/register?next=${signInNext}`}
                  className="rounded-xs border border-ink/15 px-8 py-4 text-center text-sm font-bold"
                >
                  Create account
                </Link>
              </div>
              <p className="text-2xs text-ink-faint">
                Your bag is saved on this device until you complete checkout.
              </p>
            </div>
          )}

          {!authLoading && user && step === "Details" && (
            <form
              className="animate-fade flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateDetails()) setStep("Delivery");
              }}
              noValidate
            >
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Where is it going?</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {savedAddresses.length
                    ? "Your default address is selected. Pick another, or add a new one."
                    : "We will send tracking to this email and text the courier updates."}
                </p>
              </div>

              {savedAddresses.length > 0 && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="sr-only">Saved addresses</legend>
                  {savedAddresses.map((saved) => {
                    const active = selectedAddressId === saved._id;
                    return (
                      <label
                        key={saved._id}
                        className={`flex cursor-pointer gap-4 rounded-md border p-5 transition ${
                          active ? "border-ink bg-cream" : "border-ink/12 hover:border-ink/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkout-address"
                          checked={active}
                          onChange={() => pickSaved(saved)}
                          className="mt-1 size-4 accent-[var(--color-accent-600)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold">{saved.fullName}</span>
                            {saved.isDefault && (
                              <span className="rounded-xs bg-accent-600 px-2 py-0.5 text-2xs font-bold text-cream">
                                Default
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-ink-soft">
                            {saved.addressLine1}
                            {saved.addressLine2 ? `, ${saved.addressLine2}` : ""}
                            {saved.landmark ? `, ${saved.landmark}` : ""}
                            <br />
                            {saved.city}, {saved.state} {saved.postalCode}
                            <br />
                            {saved.phone}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    onClick={startNewAddress}
                    className={`rounded-md border border-dashed px-5 py-4 text-left text-sm font-bold transition ${
                      selectedAddressId === "new"
                        ? "border-ink bg-cream"
                        : "border-ink/20 text-ink-soft hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    + Add a new address
                  </button>
                </fieldset>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {(!usingSaved || savedAddresses.length === 0) && (
                  <Field
                    label="Full name"
                    value={address.fullName}
                    onChange={set("fullName")}
                    error={errors.fullName}
                    autoComplete="name"
                    placeholder="Ankit Kumar"
                  />
                )}
                <Field
                  label="Email"
                  type="email"
                  value={address.email}
                  onChange={set("email")}
                  error={errors.email}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={usingSaved ? "sm:col-span-2" : undefined}
                />
                {!usingSaved && (
                  <>
                    <Field
                      label="Mobile"
                      type="tel"
                      value={address.phone}
                      onChange={set("phone")}
                      error={errors.phone}
                      autoComplete="tel"
                      placeholder="98765 43210"
                    />
                    <Field
                      label="PIN code"
                      inputMode="numeric"
                      value={address.pincode}
                      onChange={onPincode}
                      error={errors.pincode}
                      autoComplete="postal-code"
                      placeholder="560001"
                    />
                    <Field
                      label="Address line 1"
                      className="sm:col-span-2"
                      value={address.line1}
                      onChange={set("line1")}
                      error={errors.line1}
                      autoComplete="address-line1"
                      placeholder="Flat 402, Aralia Apartments"
                    />
                    <Field
                      label="Address line 2 (optional)"
                      className="sm:col-span-2"
                      value={address.line2}
                      onChange={set("line2")}
                      autoComplete="address-line2"
                      placeholder="Off 12th Main, Indiranagar"
                    />
                    <Field
                      label="City"
                      value={address.city}
                      onChange={set("city")}
                      error={errors.city}
                      autoComplete="address-level2"
                      placeholder="Bengaluru"
                    />
                    <Field
                      label="State"
                      value={address.state}
                      onChange={set("state")}
                      error={errors.state}
                      autoComplete="address-level1"
                      placeholder="Karnataka"
                    />
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={!detailsComplete}
                aria-disabled={!detailsComplete}
                title={detailsComplete ? undefined : "Fill in every field above to continue"}
                className="mt-2 w-full rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream transition hover:gradient-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:gradient-accent sm:w-fit"
              >
                Continue to delivery →
              </button>
            </form>
          )}

          {!authLoading && user && step === "Delivery" && (
            <div className="animate-fade flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">How fast should it land?</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Delivering to {address.city || "your address"} {address.pincode}
                </p>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Delivery method</legend>
                {shippingMethods.map((m) => {
                  const active = shippingMethodId === m.id;
                  const free = summary.subtotal >= 149900;
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-md border p-5 transition ${
                        active ? "border-ink bg-cream" : "border-ink/12 hover:border-ink/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={m.id}
                        checked={active}
                        onChange={() => setShipping(m.id)}
                        className="size-4 accent-[var(--color-accent-600)]"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-bold">{m.name}</span>
                        <span className="block text-2xs text-ink-faint">{m.detail}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold">
                          {free ? <span className="text-accent-700">Free</span> : formatMoney(m.price)}
                        </span>
                        <span className="block text-2xs text-ink-faint">{m.eta}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              {/* SCHEDULED orders are rejected without a date and slot. */}
              {requiresSchedule && (
                <div className="grid gap-4 rounded-md border border-ink/12 bg-cream p-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-2xs font-bold tracking-[0.12em] text-ink-soft uppercase">
                      Delivery date
                    </span>
                    <input
                      type="date"
                      value={deliveryDate}
                      min={earliestDeliveryDate()}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="rounded-md border border-ink/12 bg-white px-4 py-3 text-sm outline-none focus:border-ink"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-2xs font-bold tracking-[0.12em] text-ink-soft uppercase">
                      Time slot
                    </span>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="rounded-md border border-ink/12 bg-white px-4 py-3 text-sm outline-none focus:border-ink"
                    >
                      {DELIVERY_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep("Details")}
                  className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("Payment")}
                  disabled={requiresSchedule && !deliveryDate}
                  className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-cream transition hover:gradient-accent-soft disabled:opacity-60"
                >
                  {requiresSchedule && !deliveryDate ? "Pick a delivery date" : "Continue to payment →"}
                </button>
              </div>
            </div>
          )}

          {!authLoading && user && step === "Payment" && (
            <div className="animate-fade flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Review and pay</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Payments are handled by Razorpay. We never see your card details.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-line bg-cream p-5">
                  <p className="text-2xs font-bold tracking-[0.12em] text-ink-faint uppercase">
                    Delivering to
                  </p>
                  <p className="mt-2 text-sm font-semibold">{address.fullName}</p>
                  <p className="text-xs text-ink-soft">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                    <br />
                    {address.phone} · {address.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep("Details")}
                    className="mt-3 text-2xs underline underline-offset-2"
                  >
                    Edit
                  </button>
                </div>

                <div className="rounded-md border border-line bg-cream p-5">
                  <p className="text-2xs font-bold tracking-[0.12em] text-ink-faint uppercase">
                    Delivery method
                  </p>
                  <p className="mt-2 text-sm font-semibold">{method.name}</p>
                  <p className="text-xs text-ink-soft">{method.eta}</p>
                  <button
                    type="button"
                    onClick={() => setStep("Delivery")}
                    className="mt-3 text-2xs underline underline-offset-2"
                  >
                    Change
                  </button>
                </div>
              </div>


              {paymentError && (
                <p className="rounded-md border border-accent-600/40 bg-accent-50 px-5 py-4 text-sm text-accent-700">
                  {paymentError}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep("Delivery")}
                  className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={pay}
                  disabled={paying}
                  className="flex-1 rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-white shadow-soft transition hover:brightness-110 disabled:opacity-60 sm:flex-none"
                >
                  {paying ? "Opening Razorpay…" : `Pay ${formatMoney(summary.total)} securely`}
                </button>
              </div>

              <p className="text-2xs text-ink-faint">
                The final total is confirmed by our server before payment. 256-bit encrypted. By
                paying you accept our terms and the 14-day returns policy.
              </p>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-[12vh]">
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
}
