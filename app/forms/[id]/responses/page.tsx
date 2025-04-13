"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  User,
  Loader2,
  Sparkles,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import PageWrapper from "@/components/page-wrapper";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

interface ResponsesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const { messages, append, status, setMessages } = useChat({
    api: "/api/form-summary",
    initialMessages: [],
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {},
    onResponse: (response) => {},
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        // Fetch form
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (formError) {
          console.error("Error fetching form:", formError);
          throw formError;
        }
        setForm(formData);

        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from("responses")
          .select("*")
          .eq("form_id", id)
          .order("created_at", { ascending: false });

        if (responsesError) {
          console.error("Error fetching responses:", responsesError);
          throw responsesError;
        }
        setResponses(responsesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load responses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, router]);

  const generateSummary = async (responseIds?: string[]) => {
    try {
      setShowSummary(true);
      const filteredResponses = responseIds?.length
        ? responses.filter((r) => responseIds.includes(r.id))
        : responses;

      const prompt = `Analyze these form responses for "${form?.title}":

Questions: ${form?.prompts.join(" | ")}

Responses:
${filteredResponses
  .map(
    (r, i) => `
#${i + 1}: ${Object.entries(r.answers)
      .map(([q, a]) => `${q}: ${a}`)
      .join(" | ")}`
  )
  .join("\n")}

Provide:
1. Key patterns/trends
2. Notable insights
3. Unique responses
4. Stats (if relevant)`;

      // Clear existing messages and append the new prompt
      setMessages([]);
      await append({
        role: "user",
        content: prompt,
      });
    } catch (error) {
      console.error("Error generating summary:", error);
    }
  };

  const exportToCsv = () => {
    if (!form || !responses.length) return;

    // Create CSV header
    const headers = ["Response ID", "Timestamp", ...form.prompts];

    // Create CSV rows
    const rows = responses.map((response) => {
      const answers = form.prompts.map(
        (_, index) => response.answers[index] || ""
      );
      return [
        response.id,
        new Date(response.created_at).toLocaleString(),
        ...answers,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${form.title}-responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  if (!form) {
    return (
      <PageWrapper>
        <div className="text-center">Form not found</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <p className="text-sm text-gray-500">
            {responses.length} response{responses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() =>
              generateSummary(
                selectedResponseIds.length ? selectedResponseIds : undefined
              )
            }
            disabled={
              status === "submitted" ||
              status === "streaming" ||
              responses.length === 0
            }
          >
            {status === "submitted" || status === "streaming" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {selectedResponseIds.length > 0
              ? `Summarize ${selectedResponseIds.length} Selected`
              : "Summarize All Responses"}
          </Button>
          <Button
            variant="outline"
            onClick={exportToCsv}
            disabled={responses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-gray-500">No responses yet</p>
            </CardContent>
          </Card>
        ) : (
          responses.map((response) => (
            <Card
              key={response.id}
              className={`${
                selectedResponseIds.includes(response.id)
                  ? "border-primary"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedResponseIds((prev) =>
                        prev.includes(response.id)
                          ? prev.filter((id) => id !== response.id)
                          : [...prev, response.id]
                      )
                    }
                  >
                    {selectedResponseIds.includes(response.id)
                      ? "Deselect"
                      : "Select"}
                  </Button>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/forms/${id}/responses/${response.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Details
                  </Link>
                </div>
                <div className="space-y-4">
                  {Object.entries(response.answers).map(
                    ([question, answer]) => (
                      <div key={question} className="space-y-2">
                        <p className="font-medium">
                          {form?.prompts[question as unknown as number]}
                        </p>
                        <p className="text-gray-600">{answer}</p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showSummary && (
        <div className="lg:sticky lg:top-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" />
                <h2 className="font-medium">AI Summary</h2>
              </div>
              <div className="space-y-4">
                {(status === "submitted" || status === "streaming") && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating summary...
                  </div>
                )}
                {messages.length > 0 && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {messages[messages.length - 1].content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
