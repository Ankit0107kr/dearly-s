import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell py-16 text-center text-sm text-ink-soft">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
