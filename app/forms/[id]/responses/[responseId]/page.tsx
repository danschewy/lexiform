"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import PageWrapper from "@/components/page-wrapper";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

interface ResponsePageProps {
  params: Promise<{
    id: string;
    responseId: string;
  }>;
}

export default function ResponsePage({ params }: ResponsePageProps) {
  const resolvedParams = use(params);
  const { id, responseId } = resolvedParams;
  const [form, setForm] = useState<Form | null>(null);
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/auth/login");
        return;
      }

      try {
        console.log("Fetching response:", responseId);
        // Fetch response first
        const { data: responseData, error: responseError } = await supabase
          .from("responses")
          .select("*")
          .eq("id", responseId)
          .single();

        if (responseError) {
          console.error("Error fetching response:", responseError);
          throw responseError;
        }

        // Check if user has access to this response
        // Allow access if user is either the form owner or the response submitter
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (formError) {
          console.error("Error fetching form:", formError);
          throw formError;
        }

        if (formData.user_id !== user.id && responseData.user_id !== user.id) {
          console.log("User does not have access to this response");
          setError("You don't have access to this response");
          return;
        }

        setResponse(responseData);
        setForm(formData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load response");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, responseId, user, router]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="text-center">Loading...</div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-center text-red-500">{error}</div>
      </PageWrapper>
    );
  }

  if (!form || !response) {
    return (
      <PageWrapper>
        <div className="text-center">Response not found</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/forms/${id}/responses`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <p className="text-sm text-gray-500">
            Response from{" "}
            {response.email ||
              `Anonymous User (${response.user_id.slice(0, 8)}...)`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm text-gray-500">
                    Response #{response.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(response.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(response.answers).map(([question, answer]) => (
                  <div key={question} className="space-y-2">
                    <p className="font-medium">{question}</p>
                    <p className="text-gray-600">{answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" />
                <h2 className="font-medium">Response Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Submission Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(response.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Response ID</p>
                  <p className="text-sm text-gray-600">{response.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-gray-600">{response.user_id}</p>
                </div>
                {response.email && (
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{response.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
