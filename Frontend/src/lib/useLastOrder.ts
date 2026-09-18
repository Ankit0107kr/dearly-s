"use client";

import { useSyncExternalStore } from "react";
import { ORDER_STORAGE_KEY, type PlacedOrder } from "@/lib/razorpay-client";

/**
 * The confirmation page reads the just-placed order from sessionStorage, which
 * only exists on the client. Cached at module level so getSnapshot stays
 * referentially stable across renders.
 */
let cached: PlacedOrder | null = null;
let read = false;

function readOrder(): PlacedOrder | null {
  if (read) return cached;
  read = true;
  try {
    const raw = window.sessionStorage.getItem(ORDER_STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as PlacedOrder) : null;
  } catch {
    cached = null;
  }
  return cached;
}

const subscribe = () => () => {};
const getServerSnapshot = () => null;

export function useLastOrder() {
  return useSyncExternalStore(subscribe, readOrder, getServerSnapshot);
}
