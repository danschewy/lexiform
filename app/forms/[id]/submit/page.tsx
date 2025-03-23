"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Edit2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/lib/supabase";

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
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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

    // If there are more questions, add the next one
    if (currentPromptIndex < form.prompts.length - 1) {
      const nextPrompt = form.prompts[currentPromptIndex + 1];
      newMessages.push({
        id: `q${currentPromptIndex + 2}`,
        role: "system" as const,
        content: nextPrompt,
      });
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      // If this was the last question, show submit message
      newMessages.push({
        id: "final",
        role: "system" as const,
        content:
          "Thank you for your responses! Click 'Submit' to finish the form.",
      });
    }

    setMessages(newMessages);
  };

  const handleFinalSubmit = async () => {
    if (!form) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("responses").insert({
        form_id: id,
        answers,
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

      <Card className="max-w-2xl mx-auto">
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
              </div>
            </div>
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={2}
                  className="flex-1"
                />
                {currentPromptIndex < form.prompts.length ? (
                  <Button
                    type="submit"
                    className="self-end"
                    disabled={!input.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="self-end"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
