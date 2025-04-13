import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("redirect_to");

    if (!code) {
      throw new Error("No code provided");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      throw error;
    }

    // URL to redirect to after sign in process completes
    const redirectTo = next || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (error) {
    console.error("Auth callback error:", error);
    // Redirect to login page with error
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_error", request.url)
    );
  }
}
