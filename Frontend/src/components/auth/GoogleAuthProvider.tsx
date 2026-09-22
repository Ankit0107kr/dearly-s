"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";

type GoogleAuthState = {
  ready: boolean;
  clientId: string;
};

const GoogleAuthContext = createContext<GoogleAuthState>({ ready: false, clientId: "" });

export function useGoogleAuthConfig() {
  return useContext(GoogleAuthContext);
}

const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState(envClientId);
  const [ready, setReady] = useState(Boolean(envClientId));

  useEffect(() => {
    if (envClientId) return;

    let cancelled = false;
    authApi
      .config()
      .then((res) => {
        if (cancelled) return;
        setClientId(res.data?.googleClientId?.trim() || "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ ready, clientId }), [ready, clientId]);

  return (
    <GoogleAuthContext.Provider value={value}>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
      ) : (
        children
      )}
    </GoogleAuthContext.Provider>
  );
}
