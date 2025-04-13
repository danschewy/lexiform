"use client";

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/app/auth/login/actions";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "@radix-ui/react-separator";
import { LoginForm } from "@/app/auth/login/page";

type AuthContextType = {
  user: User | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle(redirectTo || undefined);
      if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Google
        </>
      )}
    </Button>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {/* ... existing card header ... */}
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <GoogleSignInButton />
                <Button variant="outline" type="button" className="w-full">
                  GitHub
                </Button>
              </div>
            </div>
          </CardContent>
          {/* ... existing card footer ... */}
        </Card>
      </main>
    </div>
  );
}
