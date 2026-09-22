"use client";

import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useGoogleAuthConfig } from "@/components/auth/GoogleAuthProvider";

type Props = {
  onCredential: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInSection({ onCredential, onError, disabled }: Props) {
  const { ready, clientId } = useGoogleAuthConfig();

  if (!ready) {
    return null;
  }

  if (!clientId) {
    if (process.env.NODE_ENV !== "development") {
      return null;
    }
    return (
      <p className="rounded-md border border-dashed border-ink/15 bg-white/60 px-4 py-3 text-xs text-ink-soft">
        Google sign-in needs <code className="text-ink">GOOGLE_CLIENT_ID</code> in{" "}
        <code className="text-ink">Backend/.env</code> (restart the API). In Google Cloud,
        add <code className="text-ink">http://localhost:3000</code> as an authorized JavaScript
        origin.
      </p>
    );
  }

  return (
    <>
      <GoogleSignInButton onCredential={onCredential} onError={onError} disabled={disabled} />
      <AuthDivider />
    </>
  );
}
