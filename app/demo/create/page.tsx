"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createDemoForm } from "./actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

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

export default function DemoCreatePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! This is the demo form creator. You can:\\n\\n1. Describe what you want to build.\\n2. Ask me to add or modify questions.\\n3. Get suggestions for improvements.\\n\\nWhat would you like to create for your demo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    questions: [{ text: "", type: "text" }],
    allow_anonymous: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/demo-chat", {
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
        throw new Error("Failed to get response from chat API");
      }

      const data = await response.json();
      const assistantMessageContent = data.message;

      let jsonToParse = null;

      // 1. Try to extract from ```json ... ``` code block first
      const markdownJsonMatch = assistantMessageContent.match(
        /\`\`\`(?:json)?\s*(\{[\s\S]+?\})\s*\`\`\`/
      );

      if (markdownJsonMatch && markdownJsonMatch[1]) {
        jsonToParse = markdownJsonMatch[1];
      } else {
        // 2. Fallback: if no markdown, try to find a JSON-like block (original greedy approach)
        const generalJsonMatch = assistantMessageContent.match(/(\{[\s\S]+\})/);
        if (generalJsonMatch && generalJsonMatch[1]) {
          jsonToParse = generalJsonMatch[1];
        }
      }

      if (jsonToParse) {
        try {
          const parsed = JSON.parse(jsonToParse);
          // 3. Validate the structure more thoroughly
          if (
            parsed.title &&
            Array.isArray(parsed.questions) &&
            parsed.questions.every(
              (q: any) =>
                typeof q.text !== "undefined" && typeof q.type !== "undefined"
            )
          ) {
            setFormState(parsed);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Demo form updated by AI!" },
            ]);
          } else {
            console.warn(
              "Parsed JSON, but structure is invalid (missing title, questions array, or question fields):",
              parsed
            );
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: assistantMessageContent }, // Show raw message
            ]);
          }
        } catch (e) {
          console.error(
            "Error parsing AI response JSON:",
            e,
            "Attempted to parse:",
            jsonToParse
          );
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantMessageContent }, // Show raw message
          ]);
        }
      } else {
        // No JSON block found by either regex
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessageContent }, // Show raw message
        ]);
      }
    } catch (error) {
      toast.error("Failed to get response from chat API");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForm = async () => {
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
    const invalidMultipleChoice = formState.questions.find(
      (question) =>
        question.type === "multiple-choice" &&
        (!question.options ||
          question.options.length === 0 ||
          question.options.some((opt) => !opt.trim()))
    );
    if (invalidMultipleChoice) {
      setError(
        "Multiple-choice questions must have at least one option, and options cannot be empty."
      );
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      const result = await createDemoForm(formState);
      if (result && result.success && result.formId) {
        try {
          localStorage.setItem(
            `demoForm-${result.formId}`,
            JSON.stringify(formState)
          );
          toast.success("Demo form created and saved locally!");
          router.push(`/demo/${result.formId}`);
        } catch (storageError) {
          console.error(
            "Error saving demo form to localStorage:",
            storageError
          );
          toast.error(
            "Could not save demo form locally, but proceeding to view. Form might not load correctly."
          );
          router.push(`/demo/${result.formId}`);
        }
      } else {
        throw new Error(
          result?.message || "Failed to get valid formId from demo creation"
        );
      }
    } catch (error: any) {
      setError(error.message || "Failed to create demo form");
      toast.error(error.message || "Failed to create demo form");
      console.error("Create demo form error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const addQuestion = () => {
    setFormState((prev) => ({
      ...prev,
      questions: [...prev.questions, { text: "", type: "text", options: [] }],
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormState((prev) => {
      const newQuestions = prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      );
      if (updates.type === "multiple-choice" && index !== undefined) {
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
          <CardTitle>Create New Demo Form</CardTitle>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateForm}
              disabled={isCreating || isLoading}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo...
                </>
              ) : (
                "Create Demo Form"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Demo Form Preview</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-title">Title</Label>
                    <Input
                      id="form-title"
                      value={formState.title}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter demo form title"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-description">Description</Label>
                    <Textarea
                      id="form-description"
                      value={formState.description}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter demo form description"
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
                            <Label htmlFor={`q-${index}-text`}>
                              Question {index + 1}
                            </Label>
                            <Input
                              id={`q-${index}-text`}
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
                            className="mt-6"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Label
                            htmlFor={`q-${index}-type`}
                            className="whitespace-nowrap"
                          >
                            Type:
                          </Label>
                          <Select
                            value={question.type}
                            onValueChange={(value: Question["type"]) =>
                              updateQuestion(index, {
                                type: value,
                                options:
                                  value === "multiple-choice"
                                    ? question.options?.length
                                      ? question.options
                                      : [""]
                                    : [],
                              })
                            }
                            disabled={isCreating}
                          >
                            <SelectTrigger
                              id={`q-${index}-type`}
                              className="w-[180px]"
                            >
                              <SelectValue placeholder="Question type" />
                            </SelectTrigger>
                            <SelectContent position="item-aligned">
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="multiple-choice">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="true-false">
                                True/False
                              </SelectItem>
                              {/* <SelectItem value="textarea">Textarea</SelectItem> EDITED: Commented out */}
                            </SelectContent>
                          </Select>
                        </div>
                        {question.type === "multiple-choice" && (
                          <div className="space-y-2 pl-4">
                            <Label>Options</Label>
                            {(question.options || []).map(
                              (option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex gap-2 items-center"
                                >
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
                                    placeholder={`Option ${optionIndex + 1}`}
                                    disabled={isCreating}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newOptions =
                                        question.options?.filter(
                                          (_, i) => i !== optionIndex
                                        );
                                      updateQuestion(index, {
                                        options: newOptions,
                                      });
                                    }}
                                    disabled={
                                      isCreating ||
                                      (question.options &&
                                        question.options.length <= 1)
                                    }
                                  >
                                    &times;
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
                      Allow anonymous submissions for this demo form
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AI Assistant (Demo)</h3>
                <ScrollArea className="h-[calc(500px_-_theme(spacing.8)_-_theme(spacing.6)_-_2rem)] rounded-md border p-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`inline-block max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content.split("\\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for help or describe your demo form..."
                    disabled={isLoading || isCreating}
                  />
                  <Button type="submit" disabled={isLoading || isCreating}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send"
                    )}
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
