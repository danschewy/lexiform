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
  MessageSquare,
  Wand2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth-provider";
import type { Database } from "@/lib/supabase";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type Response = Database["public"]["Tables"]["responses"]["Row"];

interface ResponsesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteForm = async () => {
    try {
      setIsDeleting(true);

      // First delete all responses
      const { error: responsesError } = await supabase
        .from("responses")
        .delete()
        .eq("form_id", id);

      if (responsesError) throw responsesError;

      // Then delete the form
      const { error: formError } = await supabase
        .from("forms")
        .delete()
        .eq("id", id);

      if (formError) throw formError;

      toast.success("Form and responses deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading)
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!form)
    return <div className="container mx-auto px-4 py-8">Form not found</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{form?.title}</h1>
            <p className="text-sm text-gray-500">
              {responses.length} responses received
            </p>
          </div>
        </div>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Form</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this form? This will also
                  delete all {responses.length} responses. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteForm}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Form"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={`${
                selectedResponseIds.includes(response.id)
                  ? "border-primary"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm text-gray-500">
                      Response #{response.id.slice(0, 8)}...
                    </span>
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
      </div>
    </div>
  );
}
