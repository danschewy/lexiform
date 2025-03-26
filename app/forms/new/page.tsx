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

type Template = Database["public"]["Tables"]["templates"]["Row"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FormState {
  title: string;
  description: string;
  prompts: string[];
  allow_anonymous: boolean;
}

export default function NewFormPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    prompts: [],
    allow_anonymous: false,
  });

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
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
        prompts: [],
        allow_anonymous: false,
      });
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormState({
        title: template.title,
        description: template.description || "",
        prompts: template.prompts,
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
          if (parsed.title && Array.isArray(parsed.prompts)) {
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
      toast.error("You must be logged in to create a form");
      return;
    }

    try {
      const formId = await createForm(formState);
      toast.success("Form created successfully!");
      router.push(`/forms/${formId}`);
    } catch (error) {
      toast.error("Failed to create form");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start from scratch</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    placeholder="Describe your form or make changes..."
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
                    Send
                  </Button>
                </form>
              </div>

              {/* Form Preview */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(e) =>
                      setFormState({ ...formState, title: e.target.value })
                    }
                    placeholder="Enter form title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formState.description}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter form description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Questions</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    {formState.prompts.map((prompt, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={prompt}
                            onChange={(e) => {
                              const newPrompts = [...formState.prompts];
                              newPrompts[index] = e.target.value;
                              setFormState({
                                ...formState,
                                prompts: newPrompts,
                              });
                            }}
                            placeholder={`Question ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newPrompts = formState.prompts.filter(
                                (_, i) => i !== index
                              );
                              setFormState({
                                ...formState,
                                prompts: newPrompts,
                              });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_anonymous"
                    checked={formState.allow_anonymous}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        allow_anonymous: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="allow_anonymous">
                    Allow anonymous submissions
                  </Label>
                </div>
                <Button onClick={handleCreateForm} className="w-full">
                  Create Form
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
