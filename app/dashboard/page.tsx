"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import PageWrapper from "@/components/page-wrapper";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

export default function DashboardPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from("forms")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (formsError) throw formsError;

        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from("responses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (responsesError) throw responsesError;

        setForms(formsData || []);
        setResponses(responsesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/forms/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold">Your Forms</h2>
          </div>
          <div className="space-y-4">
            {forms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No forms yet. Create your first form to get started!
              </div>
            ) : (
              forms.map((form) => (
                <div
                  key={form.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-medium">{form.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {form.description || "No description"}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/forms/${form.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/forms/${form.id}/responses`}>
                      <Button variant="outline" size="sm">
                        Responses
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center mb-4">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Recent Responses</h2>
          </div>
          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No responses yet. Share your forms to start collecting
                responses!
              </div>
            ) : (
              responses.map((response) => (
                <div
                  key={response.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {forms.find((f) => f.id === response.form_id)?.title ||
                          "Unknown Form"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(response.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/forms/${response.form_id}/responses/${response.id}`}
                    >
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
