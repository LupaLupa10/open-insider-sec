import Link from "next/link";

import { loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="shell auth-layout stack">
      <div className="section-heading">
        <div className="eyebrow">Account access</div>
        <h2>Log in to save your filters.</h2>
      </div>
      <AuthForm
        action={loginAction}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" }
        ]}
        helperLink={{ href: "/auth/forgot-password", label: "Forgot password?" }}
        submitLabel="Log in"
      />
      <p className="muted">
        Need an account? <Link href="/auth/sign-up">Create one</Link>.
      </p>
    </div>
  );
}
