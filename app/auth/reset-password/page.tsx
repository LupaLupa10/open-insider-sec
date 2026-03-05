import { updatePasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return (
    <div className="shell auth-layout stack">
      <div className="section-heading">
        <div className="eyebrow">Choose a new password</div>
        <h2>Complete your password reset.</h2>
      </div>
      <AuthForm
        action={updatePasswordAction}
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
          { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" }
        ]}
        submitLabel="Update password"
      />
    </div>
  );
}
