"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";

type Props = {
  onCredential: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({ onCredential, onError, disabled }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(200, Math.floor(el.offsetWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google did not return a sign-in token");
      return;
    }
    void onCredential(response.credential);
  };

  return (
    <div
      ref={wrapRef}
      className={`w-full ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        theme="outline"
        size="large"
        shape="rectangular"
        text="continue_with"
        width={width}
      />
    </div>
  );
}
