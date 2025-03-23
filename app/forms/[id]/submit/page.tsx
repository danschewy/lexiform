"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

      <Card>
        <CardHeader>
          <CardTitle>Fill out the form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {form.prompts.map((prompt, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium">{prompt}</label>
                <Textarea
                  value={answers[prompt] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [prompt]: e.target.value })
                  }
                  placeholder="Type your answer here..."
                  rows={3}
                />
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
