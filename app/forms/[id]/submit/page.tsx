"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/lib/supabase";

type Form = Database["public"]["Tables"]["forms"]["Row"];

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
  const [inputValue, setInputValue] = useState("");

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

  const handleSubmit = async () => {
    if (!form) return;

    if (currentPromptIndex < form.prompts.length) {
      // Save current answer and move to next prompt
      setAnswers({
        ...answers,
        [form.prompts[currentPromptIndex]]: inputValue,
      });
      setCurrentPromptIndex(currentPromptIndex + 1);
      setInputValue("");
    } else {
      // Submit all answers
      setSubmitting(true);
      try {
        const { error } = await supabase.from("responses").insert({
          form_id: id,
          answers: {
            ...answers,
            [form.prompts[currentPromptIndex - 1]]: inputValue,
          },
        });

        if (error) throw error;
        setSubmitted(true);
      } catch (error) {
        console.error("Error submitting response:", error);
        alert("Failed to submit response. Please try again.");
      } finally {
        setSubmitting(false);
      }
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

      <div className="max-w-2xl mx-auto">
        <div className="space-y-4 mb-6">
          {form.prompts.slice(0, currentPromptIndex).map((prompt, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-medium">{prompt}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm">{answers[prompt]}</p>
              </div>
            </div>
          ))}
          {currentPromptIndex < form.prompts.length && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm font-medium">
                {form.prompts[currentPromptIndex]}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer here..."
            rows={3}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !inputValue.trim()}
            className="self-end"
          >
            <Send className="mr-2 h-4 w-4" />
            {submitting
              ? "Submitting..."
              : currentPromptIndex === form.prompts.length - 1
              ? "Submit"
              : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
