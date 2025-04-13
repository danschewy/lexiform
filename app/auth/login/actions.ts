"use server";

import { createClient } from "@/utils/supabase/server";

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  url?: string;
} | null;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message,
      };
    }

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

export async function signInWithGoogle(
  redirectTo?: string
): Promise<LoginState> {
  try {
    const supabase = await createClient();
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          redirect_to: redirectTo || "/dashboard",
        },
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error("No URL returned from Supabase OAuth");

    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.error("Error in signInWithGoogle:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google",
    };
  }
}

export async function signInWithGitHub(
  redirectTo?: string
): Promise<LoginState> {
  try {
    const supabase = await createClient();
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          redirect_to: redirectTo || "/dashboard",
        },
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error("No URL returned from Supabase OAuth");

    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.error("Error in signInWithGitHub:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to sign in with GitHub",
    };
  }
}
