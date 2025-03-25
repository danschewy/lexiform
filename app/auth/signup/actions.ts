"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type SignUpState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | null;

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string;

  if (!email || !password) {
    return {
      error: "Please provide both email and password",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL
        }/auth/callback?redirectTo=${encodeURIComponent(
          redirectTo || "/dashboard"
        )}`,
      },
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    // Return success state with redirect URL
    return {
      success: true,
      redirectTo: redirectTo || "/dashboard",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
