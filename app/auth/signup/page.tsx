"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, SignUpState } from "./actions";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

function SignUpForm() {
  const [state, formAction] = useActionState<SignUpState, FormData>(
    signUp,
    null
  );
  const redirectTo = useSearchParams().get("redirectTo");
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <form
        action={formAction}
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
      >
        <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        {state?.error && (
          <p className="text-sm text-red-500 mb-4">{state.error}</p>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Suspense fallback={<LoadingState />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
