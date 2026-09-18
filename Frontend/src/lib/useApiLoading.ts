"use client";

import { useEffect, useState } from "react";
import { subscribeApiLoading } from "@/lib/api-loading";

export function useApiLoading() {
  const [pending, setPending] = useState(0);

  useEffect(() => subscribeApiLoading(setPending), []);

  return pending > 0;
}
