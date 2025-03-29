import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, try to get user
  if (!session) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Allow access to public pages without redirection
    const isPublicPage =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/privacy" ||
      request.nextUrl.pathname === "/terms" ||
      request.nextUrl.pathname.startsWith("/auth/");

    // Check if this is a form submission page or API endpoint
    const isFormSubmitPage = request.nextUrl.pathname.match(
      /^\/forms\/[^/]+\/submit$/
    );
    const isFormSubmitApi = request.nextUrl.pathname === "/api/form-submit";

    if (isFormSubmitPage || isFormSubmitApi) {
      // For API requests, get form ID from the request body
      let formId;
      if (isFormSubmitApi) {
        try {
          const body = await request.clone().json();
          formId = body.formData?.id;
        } catch (e) {
          console.error("Failed to parse request body:", e);
        }
      } else {
        // For page requests, get form ID from URL
        formId = request.nextUrl.pathname.split("/")[2];
      }

      if (formId) {
        // Check if the form allows anonymous submissions
        const { data: form } = await supabase
          .from("forms")
          .select("allow_anonymous")
          .eq("id", formId)
          .single();

        // If form allows anonymous submissions, allow access without authentication
        if (form?.allow_anonymous) {
          return supabaseResponse;
        }
      }
    }

    if (!user && !isPublicPage) {
      // no user, redirect to login page with the original URL as redirectTo
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
