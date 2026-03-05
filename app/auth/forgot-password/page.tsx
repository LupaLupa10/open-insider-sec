import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <div className="shell auth-layout stack">
      <div className="section-heading">
        <div className="eyebrow">Password reset</div>
        <h2>Request a reset link.</h2>
      </div>
      <AuthForm
        action={forgotPasswordAction}
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        submitLabel="Send reset link"
      />
    </div>
  );
}
