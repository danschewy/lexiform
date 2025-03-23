"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, User, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/lib/supabase";
import { useChat } from "@ai-sdk/react";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

interface ResponsesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = use(params);
  const supabase = createClient();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const { messages, append, status, setMessages } = useChat({
    api: "/api/form-summary",
    initialMessages: [],
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
    onResponse: (response) => {
      console.log("Chat response:", response);
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (formError) throw formError;
        setForm(formData);

        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from("responses")
          .select("*")
          .eq("form_id", id);

        if (responsesError) throw responsesError;
        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, supabase]);

  const generateSummary = async (userId?: string) => {
    try {
      setShowSummary(true);
      const filteredResponses = userId
        ? responses.filter((r) => r.user_id === userId)
        : responses;

      const prompt = `Please analyze and summarize the following responses to the form "${
        form?.title
      }":

Form Questions:
${form?.prompts.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Responses:
${filteredResponses
  .map(
    (r, i) => `
Response #${i + 1}:
${Object.entries(r.answers)
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join("\n")}
`
  )
  .join("\n")}

Please provide:
1. A summary of key patterns and trends
2. Notable insights or common themes
3. Any interesting outliers or unique responses
4. Statistical breakdown where relevant (e.g., common answer types)`;

      console.log("Submitting prompt:", prompt);

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

  if (loading)
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!form)
    return <div className="container mx-auto px-4 py-8">Form not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{form.title} - Responses</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateSummary(selectedUserId || undefined)}
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
            {selectedUserId ? "Summarize Selected" : "Summarize All"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={`${
                selectedUserId === response.user_id ? "border-primary" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm text-gray-500">
                      User {response.user_id.slice(0, 8)}...
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedUserId(
                        selectedUserId === response.user_id
                          ? null
                          : response.user_id
                      )
                    }
                  >
                    {selectedUserId === response.user_id
                      ? "Deselect"
                      : "Select"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(response.answers).map(
                    ([question, answer]) => (
                      <div key={question}>
                        <p className="text-sm font-medium">{question}</p>
                        <p className="text-sm text-gray-600">{answer}</p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
                  {messages
                    .filter((m) => m.role === "assistant")
                    .map((message) => (
                      <div
                        key={message.id}
                        className="text-sm text-gray-600 whitespace-pre-wrap"
                      >
                        {message.content}
                      </div>
                    ))}
                  {(status === "submitted" || status === "streaming") && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating summary...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
