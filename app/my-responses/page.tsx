"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import type { Database } from "@/lib/supabase";
import PageWrapper from "@/components/page-wrapper";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

export default function MyResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push("/auth/login");
          return;
        }

        const { data: responsesData, error: responsesError } = await supabase
          .from("responses")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (responsesError) {
          console.error("Error fetching responses:", responsesError);
          throw responsesError;
        }

        setResponses(responsesData || []);

        // Get unique form IDs from responses
        const formIds = [
          ...new Set(responsesData?.map((r) => r.form_id) || []),
        ];

        if (formIds.length > 0) {
          const { data: formsData, error: formsError } = await supabase
            .from("forms")
            .select("*")
            .in("id", formIds);

          if (formsError) {
            console.error("Error fetching forms:", formsError);
            throw formsError;
          }

          setForms(formsData || []);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        setError("Failed to load responses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="text-center">Loading...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex items-center mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Responses</h1>
      </div>

      <div className="space-y-6">
        {responses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You haven't responded to any forms yet.
          </div>
        ) : (
          responses.map((response) => {
            const form = forms.find((f) => f.id === response.form_id);
            const firstAnswer = Object.entries(response.answers)[0];
            return (
              <div
                key={response.id}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">
                      {form?.title || "Unknown Form"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(response.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/forms/${response.form_id}/responses/${response.id}`}
                  >
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Response
                    </Button>
                  </Link>
                </div>
                {firstAnswer && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">
                      {form?.prompts[firstAnswer[0] as unknown as number]}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {firstAnswer[1]}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageWrapper>
  );
}
