"use server";

import { redirect } from "next/navigation";

import { getClientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const env = getClientEnv();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Account created. Check your email if confirmation is enabled." };
}

export async function forgotPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const env = getClientEnv();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent." };
}

export async function updatePasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
