"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Edit2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

type Form = Database["public"]["Tables"]["forms"]["Row"];
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

export default function SubmitPage({ params }: SubmitPageProps) {
  const { id } = use(params);
  const supabase = createClient();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        id: Date.now().toString(),
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
      // If no user is logged in, create an anonymous session
      let userId = user?.id;
      if (!userId) {
        const {
          data: { user: anonUser },
          error: signInError,
        } = await supabase.auth.signUp({
          email: `anonymous-${Date.now()}@example.com`,
          password: crypto.randomUUID(),
        });
        if (signInError) throw signInError;
        userId = anonUser?.id;
      }

      const { error } = await supabase.from("responses").insert({
        form_id: id,
        answers,
        user_id: userId,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

      <div className="max-w-2xl mx-auto space-y-4">
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
                      !input.trim() || currentPromptIndex >= form.prompts.length
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
    </div>
  );
}
