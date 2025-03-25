"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Edit2, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type Form = Database["public"]["Tables"]["forms"]["Row"];

// If the Database type doesn't include allow_anonymous yet, add it manually
interface EnhancedForm extends Form {
  allow_anonymous?: boolean;
}

interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

interface SubmitPageProps {
  params: Promise<{
    id: string;
  }>;
}

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface FormData {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  allow_anonymous: boolean;
}

interface ResponseData {
  form_id: string;
  user_id: string;
  answers: string[];
}

interface ParsedAnswers {
  answers: string[];
}

export default function SubmitPage({ params }: SubmitPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [form, setForm] = useState<EnhancedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [paragraphInput, setParagraphInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setForm(data);
        setAnswers(new Array(data.prompts.length).fill(""));
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (form && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "system",
          content: `👋 Welcome! I'll help you fill out "${form.title}". You can describe your answers in natural language, and I'll help format them appropriately. Feel free to ask for changes or clarifications at any time.`,
        },
      ]);
    }
  }, [form, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isParsing || !form) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: generateUniqueId(), role: "user", content: userMessage },
    ]);
    setIsParsing(true);

    try {
      const response = await fetch("/api/form-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            { id: generateUniqueId(), role: "user", content: userMessage },
          ],
          formData: form,
          currentAnswers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage = data.message;

      // Check if the message contains valid JSON in the expected format
      try {
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr) as ParsedAnswers;

          // Validate the structure
          if (
            Array.isArray(parsed.answers) &&
            parsed.answers.length === form.prompts.length
          ) {
            const newAnswers = parsed.answers.map(
              (answer, index) => answer || answers[index] || ""
            );
            setAnswers(newAnswers);
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: "Answers updated successfully!",
              },
            ]);
          }
        } else {
          // If no JSON found, just add the message
          setMessages((prev) => [
            ...prev,
            {
              id: generateUniqueId(),
              role: "assistant",
              content: assistantMessage,
            },
          ]);
        }
      } catch (error) {
        // If JSON parsing fails, just add the message
        setMessages((prev) => [
          ...prev,
          {
            id: generateUniqueId(),
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to get response");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!form) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      let userId = currentUser?.id;

      if (!userId && !form.allow_anonymous) {
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?redirect=${returnUrl}`);
        setSubmitting(false);
        return;
      }

      const responseData: ResponseData = {
        form_id: id,
        user_id: userId || "anonymous",
        answers,
      };

      const { error } = await supabase.from("responses").insert(responseData);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleParseParagraph = async () => {
    if (!form || !paragraphInput.trim()) return;

    setIsParsing(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              id: generateUniqueId(),
              role: "system",
              content: `Parse the following text into answers for the form questions. Return a JSON object with the answers array.`,
            },
            {
              id: generateUniqueId(),
              role: "user",
              content: paragraphInput,
            },
          ],
          formData: form,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse text");
      }

      const data = await response.json();
      const parsed = JSON.parse(data.message) as ParsedAnswers;

      if (
        Array.isArray(parsed.answers) &&
        parsed.answers.length === form.prompts.length
      ) {
        setAnswers(parsed.answers);
        setParagraphInput("");
        toast.success("Answers extracted successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error parsing text:", error);
      toast.error("Failed to parse text");
    } finally {
      setIsParsing(false);
    }
  };

  // Add function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    if (!form) return false;
    return answers.every((answer) => answer && answer.trim().length > 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Form not found</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Thank you!</h2>
              <p className="text-gray-600">Your response has been recorded.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{form.title}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <div className="space-y-4">
              <ScrollArea className="h-[500px] rounded-md border p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your answers or make changes..."
                  disabled={isParsing}
                />
                <Button type="submit" disabled={isParsing}>
                  {isParsing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send
                </Button>
              </form>
            </div>

            {/* Answers Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Answers</Label>
                {form.prompts.map((prompt, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      {prompt}
                    </Label>
                    <Textarea
                      value={answers[index] || ""}
                      readOnly
                      placeholder="Your answer will appear here"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleFinalSubmit}
                disabled={!areAllQuestionsAnswered() || submitting}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Responses"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Manual Input</Label>
              <Textarea
                value={paragraphInput}
                onChange={(e) => setParagraphInput(e.target.value)}
                placeholder="Enter your response here..."
                rows={10}
              />
            </div>
            <Button
              onClick={handleParseParagraph}
              disabled={isParsing || !paragraphInput.trim()}
              className="w-full"
            >
              {isParsing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Extract Answers from Text
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
