"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createForm } from "./actions";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type Template = Database["public"]["Tables"]["templates"]["Row"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Question {
  text: string;
  type: "text" | "multiple-choice" | "true-false";
  options?: string[];
}

interface FormState {
  title: string;
  description: string;
  questions: Question[];
  allow_anonymous: boolean;
}

export default function NewFormPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you create your form. You can:\n\n1. Start from scratch by describing what you want\n2. Select a template and modify it\n3. Ask me to add or modify questions\n4. Get suggestions for improvements\n\nWhat would you like to create?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    questions: [{ text: "", type: "text" }],
    allow_anonymous: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("templates")
          .select("*")
          .order("title");

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "none") {
      setFormState({
        title: "",
        description: "",
        questions: [{ text: "", type: "text" }],
        allow_anonymous: false,
      });
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormState({
        title: template.title,
        description: template.description || "",
        questions: template.prompts.map((prompt) => ({
          text: prompt,
          type: "text",
        })),
        allow_anonymous: false,
      });
      setMessages([
        {
          role: "assistant",
          content: `Template "${template.title}" loaded. You can now modify it using the chat interface.`,
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          formState,
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
          const parsed = JSON.parse(jsonStr);

          // Validate the structure
          if (parsed.title && Array.isArray(parsed.questions)) {
            setFormState(parsed);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Form updated successfully!" },
            ]);
          }
        } else {
          // If no JSON found, just add the message
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantMessage },
          ]);
        }
      } catch (error) {
        // If JSON parsing fails, just add the message
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessage },
        ]);
      }
    } catch (error) {
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!user) {
      setError("You must be logged in to create a form");
      return;
    }

    // Validate form
    if (!formState.title.trim()) {
      setError("Please enter a form title");
      return;
    }

    if (!formState.description.trim()) {
      setError("Please enter a form description");
      return;
    }

    if (!formState.questions.length) {
      setError("Please add at least one question");
      return;
    }

    if (formState.questions.some((question) => !question.text.trim())) {
      setError("Please fill in all questions");
      return;
    }

    // Validate multiple-choice questions have at least one option
    const invalidMultipleChoice = formState.questions.find(
      (question) =>
        question.type === "multiple-choice" &&
        (!question.options ||
          question.options.length === 0 ||
          question.options.some((opt) => !opt.trim()))
    );

    if (invalidMultipleChoice) {
      setError("Multiple-choice questions must have at least one option");
      return;
    }

    setIsCreating(true);
    try {
      const formId = await createForm(formState);
      toast.success("Form created successfully!");
      router.push(`/forms/${formId}`);
    } catch (error) {
      setError("Failed to create form");
    } finally {
      setIsCreating(false);
    }
  };

  const addQuestion = () => {
    setFormState((prev) => ({
      ...prev,
      questions: [...prev.questions, { text: "", type: "text" }],
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormState((prev) => {
      const newQuestions = prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      );

      // If changing to multiple-choice, ensure there's at least one empty option
      if (index === index && updates.type === "multiple-choice") {
        const question = newQuestions[index];
        if (!question.options || question.options.length === 0) {
          question.options = [""];
        }
      }

      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };

  const removeQuestion = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Form </CardTitle>
          <div className="flex justify-end">
            <Button onClick={handleCreateForm} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Form"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                {error}
              </div>
            )}
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateSelect}
                disabled={isLoadingTemplates || isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start from scratch</SelectItem>
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Form Preview</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formState.title}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter form title"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formState.description}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter form description"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-4">
                    {formState.questions.map((question, index) => (
                      <div
                        key={index}
                        className="space-y-2 border p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Input
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(index, { text: e.target.value })
                              }
                              placeholder="Enter question text"
                              disabled={isCreating}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            disabled={isCreating}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={question.type}
                            onValueChange={(value: Question["type"]) =>
                              updateQuestion(index, { type: value })
                            }
                            disabled={isCreating}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="multiple-choice">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="true-false">
                                True/False
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {question.type === "multiple-choice" && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {(question.options || []).map(
                              (option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...(question.options || []),
                                      ];
                                      newOptions[optionIndex] = e.target.value;
                                      updateQuestion(index, {
                                        options: newOptions,
                                      });
                                    }}
                                    placeholder="Enter option"
                                    disabled={isCreating}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions =
                                        question.options?.filter(
                                          (_, i) => i !== optionIndex
                                        );
                                      updateQuestion(index, {
                                        options: newOptions,
                                      });
                                    }}
                                    disabled={isCreating}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [
                                  ...(question.options || []),
                                  "",
                                ];
                                updateQuestion(index, { options: newOptions });
                              }}
                              disabled={isCreating}
                            >
                              Add Option
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addQuestion}
                      className="w-full"
                      disabled={isCreating}
                    >
                      Add Question
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-anonymous"
                      checked={formState.allow_anonymous}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          allow_anonymous: checked as boolean,
                        }))
                      }
                      disabled={isCreating}
                    />
                    <Label htmlFor="allow-anonymous">
                      Allow anonymous submissions
                    </Label>
                  </div>
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
                </ScrollArea>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me to help you create or modify your form..."
                    disabled={isLoading || isCreating}
                  />
                  <Button type="submit" disabled={isLoading || isCreating}>
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
