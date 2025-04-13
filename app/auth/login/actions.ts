"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
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

    // Instead of using redirect(), we'll return a success state
    // The client will handle the navigation
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

export async function signInWithGoogle(redirectTo?: string) {
  console.log("signInWithGoogle called with redirectTo:", redirectTo);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL
        }/auth/callback?redirectTo=${redirectTo || "/dashboard"}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    console.log("Supabase OAuth response:", { data, error });

    if (error) {
      console.error("Supabase OAuth error:", error);
      return {
        error: error.message,
      };
    }

    if (!data?.url) {
      console.error("No URL returned from Supabase OAuth");
      return {
        error: "Failed to initiate Google sign-in",
      };
    }

    // Redirect to the OAuth URL
    redirect(data.url);
  } catch (error) {
    console.error("Unexpected error in signInWithGoogle:", error);
    return {
      error: "An unexpected error occurred",
    };
  }
}

export async function signInWithGitHub(redirectTo?: string) {
  console.log("signInWithGitHub called with redirectTo:", redirectTo);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL
        }/auth/callback?redirectTo=${redirectTo || "/dashboard"}`,
      },
    });

    console.log("Supabase GitHub OAuth response:", { data, error });

    if (error) {
      console.error("Supabase GitHub OAuth error:", error);
      return {
        error: error.message,
      };
    }

    if (!data?.url) {
      console.error("No URL returned from Supabase GitHub OAuth");
      return {
        error: "Failed to initiate GitHub sign-in",
      };
    }

    // Redirect to the OAuth URL
    redirect(data.url);
  } catch (error) {
    console.error("Unexpected error in signInWithGitHub:", error);
    return {
      error: "An unexpected error occurred",
    };
  }
}
