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
import { ArrowLeft, Send, Edit2, Wand2, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

type Form = Database["public"]["Tables"]["forms"]["Row"];

interface QuestionType {
  type: "text" | "multiple-choice" | "true-false";
  options?: string[];
}

interface EnhancedForm extends Form {
  allow_anonymous?: boolean;
  question_types?: QuestionType[];
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
  const [form, setForm] = useState<EnhancedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const router = useRouter();

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
      console.log("Sending request to /api/form-submit");
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

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      let data;
      try {
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        console.error("Response text:", await response.text());
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        console.error("Response not OK:", data);
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage = data.message;
      console.log("Assistant message:", assistantMessage);

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
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit form"
      );
      setMessages((prev) => [
        ...prev,
        {
          id: generateUniqueId(),
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Please try again or rephrase your request.",
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!form) return;

    // Validate all questions are answered and match their types
    if (!validateAnswers()) {
      toast.error("Please answer all questions correctly");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("responses").insert({
        form_id: form.id,
        user_id: null, // Use NULL for anonymous submissions
        answers: answers,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Form submitted successfully!");

      // Redirect to a thank you page or dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  // Add function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    if (!form) return false;
    return answers.every((answer) => answer && answer.trim().length > 0);
  };

  const validateAnswers = () => {
    if (!form) return false;
    return answers.every((answer, index) => {
      const questionType = form.question_types?.[index];
      if (questionType) {
        switch (questionType.type) {
          case "text":
            return answer && answer.trim().length > 0;
          case "multiple-choice":
            return answer && questionType.options?.includes(answer);
          case "true-false":
            return answer === "true" || answer === "false";
          default:
            return false;
        }
      }
      return false;
    });
  };

  const renderQuestionInput = (
    index: number,
    question: string,
    type?: QuestionType
  ) => {
    if (!type) return null;

    switch (type.type) {
      case "text":
        return (
          <Input
            value={answers[index]}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[index] = e.target.value;
              setAnswers(newAnswers);
            }}
            placeholder="Enter your answer"
          />
        );
      case "multiple-choice":
        return (
          <RadioGroup
            value={answers[index]}
            onValueChange={(value) => {
              const newAnswers = [...answers];
              newAnswers[index] = value;
              setAnswers(newAnswers);
            }}
          >
            {type.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`option-${index}-${optionIndex}`}
                />
                <Label htmlFor={`option-${index}-${optionIndex}`}>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "true-false":
        return (
          <RadioGroup
            value={answers[index]}
            onValueChange={(value) => {
              const newAnswers = [...answers];
              newAnswers[index] = value;
              setAnswers(newAnswers);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`true-${index}`} />
              <Label htmlFor={`true-${index}`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`false-${index}`} />
              <Label htmlFor={`false-${index}`}>False</Label>
            </div>
          </RadioGroup>
        );
      default:
        return null;
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle>{form?.title}</CardTitle>
              <CardDescription>{form?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">
                Thank you for your response!
              </h2>
              <p className="text-muted-foreground">
                Your answers have been submitted successfully.
              </p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Questions */}
              <div className="space-y-6">
                {form?.prompts.map((prompt, index) => (
                  <div key={index} className="space-y-2">
                    <Label>{prompt}</Label>
                    {renderQuestionInput(
                      index,
                      prompt,
                      form.question_types?.[index]
                    )}
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={submitting || !validateAnswers()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="space-y-4">
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
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
                  <div ref={messagesEndRef} />
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
