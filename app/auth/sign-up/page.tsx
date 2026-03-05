import Link from "next/link";

import { signUpAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <div className="shell auth-layout stack">
      <div className="section-heading">
        <div className="eyebrow">Create account</div>
        <h2>Save repeat screens and keep your research state.</h2>
      </div>
      <AuthForm
        action={signUpAction}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" }
        ]}
        submitLabel="Create account"
      />
      <p className="muted">
        Already registered? <Link href="/auth/login">Log in</Link>.
      </p>
    </div>
  );
}
