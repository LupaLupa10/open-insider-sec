"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import type { AuthActionState } from "@/app/auth/actions";

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
  }>;
  helperLink?: {
    href: Route;
    label: string;
  };
};

const initialState: AuthActionState = {};

export function AuthForm({ action, submitLabel, fields, helperLink }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="auth-form panel" action={formAction}>
      {fields.map((field) => (
        <label className="stack" key={field.name}>
          <span>{field.label}</span>
          <input autoComplete={field.autoComplete} name={field.name} required type={field.type ?? "text"} />
        </label>
      ))}
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.success ? <div className="success">{state.success}</div> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Submitting..." : submitLabel}
      </button>
      {helperLink ? (
        <Link className="muted" href={helperLink.href}>
          {helperLink.label}
        </Link>
      ) : null}
    </form>
  );
}
