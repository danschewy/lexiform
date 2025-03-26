"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import PageWrapper from "@/components/page-wrapper";

type Response = Database["public"]["Tables"]["responses"]["Row"];
type Form = Database["public"]["Tables"]["forms"]["Row"];

interface ResponsePageProps {
  params: Promise<{
    id: string;
    responseId: string;
  }>;
}

export default function ResponsePage({ params }: ResponsePageProps) {
  const { id, responseId } = use(params);
  const [response, setResponse] = useState<Response | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        // Fetch response
        const { data: responseData, error: responseError } = await supabase
          .from("responses")
          .select("*")
          .eq("id", responseId)
          .single();

        if (responseError) {
          throw responseError;
        }
        setResponse(responseData);

        // Fetch form
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (formError) {
          throw formError;
        }
        setForm(formData);

        // Check if user has access to this response
        if (responseData.user_id !== user.id && formData.user_id !== user.id) {
          setError("You don't have access to this response");
        }
      } catch (error) {
        setError("Failed to load response");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, responseId, router]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !response || !form) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            {error || "Response not found"}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href={`/forms/${id}/responses`}>
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            <p className="text-sm text-gray-500">Response Details</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">
                  {response.user_id === "anonymous" ? "Anonymous" : "User"}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(response.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(response.answers).map(([question, answer]) => (
                <div key={question} className="border-b pb-4 last:border-0">
                  <h3 className="mb-2 font-semibold">
                    {form?.prompts[question as unknown as number]}
                  </h3>
                  <p className="text-gray-600">{answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
