"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Trash2,
  MessageSquare,
  ArrowRight,
  Save,
  Wand2,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase";

type Template = Database["public"]["Tables"]["templates"]["Row"];

export default function NewFormPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("Untitled Form");
  const [description, setDescription] = useState("");
  const [prompts, setPrompts] = useState<{ id: string; text: string }[]>([]);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
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
  }, [supabase]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "none") {
      setTitle("Untitled Form");
      setDescription("");
      setPrompts([]);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      const newPrompts = template.prompts.map((text: string) => ({
        id: `prompt-${Date.now()}-${Math.random()}`,
        text,
      }));
      setPrompts(newPrompts);
    }
  };

  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      onFinish: (message) => {
        console.log("AI Response received:", message);
        console.log("Message content:", message.content);
        try {
          const formData = JSON.parse(message.content);
          console.log("Successfully parsed form data:", formData);
          setTitle(formData.title);
          setDescription(formData.description);
          const newPrompts = formData.prompts.map((text: string) => ({
            id: `prompt-${Date.now()}-${Math.random()}`,
            text,
          }));
          console.log("Setting new prompts:", newPrompts);
          setPrompts(newPrompts);
        } catch (error) {
          console.error("Error parsing AI response:", error);
          console.error("Raw message content:", message.content);
        }
        setIsGenerating(false);
      },
      onError: (error) => {
        console.error("Chat error:", error);
        setIsGenerating(false);
      },
    });

  const addPrompt = () => {
    const newPrompt = {
      id: `prompt-${Date.now()}`,
      text: "Enter your question here...",
    };
    setPrompts([...prompts, newPrompt]);
    setActivePrompt(newPrompt.id);
  };

  const updatePrompt = (id: string, text: string) => {
    setPrompts(
      prompts.map((prompt) => (prompt.id === id ? { ...prompt, text } : prompt))
    );
  };

  const removePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id));
    if (activePrompt === id) {
      setActivePrompt(prompts[0]?.id || null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { error } = await supabase.from("forms").insert({
        user_id: user.id,
        title,
        description,
        prompts: prompts.map((p) => p.text),
        is_active: true,
      });

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save form. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting form generation with input:", input);
    setIsGenerating(true);
    setMessages([]);
    handleSubmit(e);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Form</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Form"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                Set the title and description for your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template
                </label>
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
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1"
                >
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-1"
                >
                  Description (optional)
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for your form"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Form Generator</CardTitle>
              <CardDescription>
                Describe the form you want to create, and AI will generate
                questions for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateForm} className="space-y-4">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Describe the form you want to create (e.g., 'Create a customer feedback survey for a restaurant')"
                  rows={4}
                />
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Questions"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Flow</CardTitle>
              <CardDescription>
                Add prompts that will be presented as a conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 border rounded-md ${
                      activePrompt === prompt.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                    onClick={() => setActivePrompt(prompt.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm font-medium">
                          Prompt {prompts.indexOf(prompt) + 1}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrompt(prompt.id)}
                        className="h-6 w-6 text-gray-500 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={prompt.text}
                      onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                    {activePrompt === prompt.id &&
                      prompts.indexOf(prompt) < prompts.length - 1 && (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              setActivePrompt(
                                prompts[prompts.indexOf(prompt) + 1].id
                              )
                            }
                          >
                            Next <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={addPrompt} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Prompt
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:sticky lg:top-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                This is how your form will appear to respondents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-4">
                {prompts.map((prompt, index) => (
                  <div key={prompt.id} className="space-y-2">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-medium">{prompt.text}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-gray-500">
                        Response will appear here
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
