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
import { useChat } from "@ai-sdk/react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Form = Database["public"]["Tables"]["forms"]["Row"];

// If the Database type doesn't include allow_anonymous yet, add it manually
interface EnhancedForm extends Form {
  allow_anonymous?: boolean;
}

type Message = {
  id: string;
  role: "system" | "user";
  content: string;
};

interface SubmitPageProps {
  params: Promise<{
    id: string;
  }>;
}

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default function SubmitPage({ params }: SubmitPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [form, setForm] = useState<EnhancedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [paragraphInput, setParagraphInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const router = useRouter();

  const {
    messages: aiMessages,
    append,
    status,
  } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      try {
        const parsedAnswers = JSON.parse(message.content);

        // Update answers with parsed values
        const newAnswers = { ...answers };
        Object.entries(parsedAnswers).forEach(([question, answer]) => {
          if (answer !== null) {
            newAnswers[question] = answer as string;
          }
        });
        setAnswers(newAnswers);

        // Update the chat interface to show the extracted answers
        const newMessages = [...messages];
        Object.entries(parsedAnswers).forEach(([question, answer]) => {
          if (answer !== null) {
            newMessages.push({
              id: generateUniqueId(),
              role: "user",
              content: answer as string,
            });
          }
        });
        setMessages(newMessages);

        toast.success("Answers extracted from text!");
      } catch (error) {
        console.error("Error parsing AI response:", error);
        toast.error("Failed to parse text. Please try again.");
      } finally {
        setIsParsing(false);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to parse text. Please try again.");
      setIsParsing(false);
    },
  });

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, supabase]);

  // Initialize chat with first question
  useEffect(() => {
    if (form && form.prompts.length > 0 && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "system",
          content: `👋 Welcome! I'll help you fill out "${form.title}". Let's get started with the first question:`,
        },
        {
          id: "q1",
          role: "system",
          content: form.prompts[0],
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
    if (!form || !input.trim()) return;

    // Add user's answer to messages
    const newMessages = [
      ...messages,
      {
        id: generateUniqueId(),
        role: "user" as const,
        content: input,
      },
    ];

    // Save the answer
    const currentPrompt = form.prompts[currentPromptIndex];
    setAnswers({
      ...answers,
      [currentPrompt]: input,
    });

    // Clear input
    setInput("");

    // Always increment the currentPromptIndex
    const nextIndex = currentPromptIndex + 1;
    setCurrentPromptIndex(nextIndex);

    // If there are more questions, add the next one
    if (nextIndex < form.prompts.length) {
      const nextPrompt = form.prompts[nextIndex];
      newMessages.push({
        id: `q${nextIndex + 1}`,
        role: "system" as const,
        content: nextPrompt,
      });
    } else {
      // If this was the last question, show submit message
      newMessages.push({
        id: "final",
        role: "system" as const,
        content:
          "✅ All questions answered! Click the Submit button below to finish.",
      });
    }

    setMessages(newMessages);
  };

  const handleFinalSubmit = async () => {
    if (!form) return;

    setSubmitting(true);
    try {
      // Get the current user's ID and email
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      let userId = currentUser?.id;
      let userEmail = currentUser?.email;

      console.log("Current user:", currentUser);

      // If no user is logged in, check if anonymous submissions are allowed
      if (!userId) {
        if (form.allow_anonymous === true) {
          console.log("No user found, but anonymous submissions are allowed");
          console.log("Creating anonymous session");
          const {
            data: { user: anonUser },
            error: signInError,
          } = await supabase.auth.signUp({
            email: `anonymous-${Date.now()}@example.com`,
            password: crypto.randomUUID(),
          });
          if (signInError) throw signInError;
          userId = anonUser?.id;
          userEmail = anonUser?.email;
          console.log("Created anonymous user:", anonUser);
        } else {
          console.log(
            "Anonymous submissions not allowed. Redirecting to login."
          );
          // Redirect to login page with redirect back to this form
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?redirect=${returnUrl}`);
          setSubmitting(false);
          return;
        }
      }

      console.log("Submitting response with:", {
        userId,
        userEmail,
        formId: id,
      });

      const { data, error } = await supabase
        .from("responses")
        .insert({
          form_id: id,
          answers,
          user_id: userId,
          email: userEmail,
        })
        .select();

      if (error) throw error;
      console.log("Response submitted successfully:", data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleParseParagraph = async () => {
    if (!paragraphInput.trim()) return;

    setIsParsing(true);
    try {
      const prompt = `Extract answers to these form questions from the following text. Return a JSON object with the question as the key and the answer as the value. If an answer isn't found, use null.

Questions:
${form?.prompts.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Text to parse:
${paragraphInput}

Return only valid JSON, no other text.`;

      await append({
        role: "user",
        content: prompt,
      });
    } catch (error) {
      console.error("Error parsing text:", error);
      toast.error("Failed to parse text. Please try again.");
      setIsParsing(false);
    }
  };

  // Add function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    if (!form) return false;
    return form.prompts.every((prompt) => {
      const answer = answers[prompt];
      return answer && answer.trim().length > 0;
    });
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chat Interface */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.role === "system"
                            ? "bg-primary/10"
                            : "bg-white border"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div className="p-4 border-t">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        currentPromptIndex < form.prompts.length
                          ? "Type your answer here..."
                          : "All questions answered!"
                      }
                      className="flex-1"
                      disabled={currentPromptIndex >= form.prompts.length}
                    />
                    <Button
                      type="submit"
                      disabled={
                        !input.trim() ||
                        currentPromptIndex >= form.prompts.length
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Next
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentPromptIndex >= form.prompts.length && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Ready to submit?</h3>
                    <p className="text-sm text-gray-500">
                      You've answered all {form.prompts.length} questions
                    </p>
                  </div>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="bg-primary"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Responses"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Manual Form Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Form Input</CardTitle>
              <CardDescription>
                Fill out the form manually or use AI to extract answers from
                text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  value={paragraphInput}
                  onChange={(e) => setParagraphInput(e.target.value)}
                  placeholder="Paste a paragraph of text to automatically extract answers..."
                  rows={4}
                  className="mb-4"
                />
                <Button
                  onClick={handleParseParagraph}
                  disabled={isParsing || !paragraphInput.trim()}
                  variant="outline"
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

              {form?.prompts.map((prompt: string, index: number) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">{prompt}</label>
                  <Textarea
                    value={answers[prompt] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [prompt]: e.target.value })
                    }
                    placeholder="Enter your answer..."
                    rows={3}
                  />
                </div>
              ))}

              {areAllQuestionsAnswered() && (
                <Card className="bg-primary/5 border-primary mt-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Ready to submit?</h3>
                        <p className="text-sm text-gray-500">
                          You've answered all {form?.prompts.length} questions
                        </p>
                      </div>
                      <Button
                        onClick={handleFinalSubmit}
                        disabled={submitting}
                        className="bg-primary"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submitting ? "Submitting..." : "Submit Responses"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
