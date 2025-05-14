"use client";

import React, { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

// Re-define types here or import from a shared location
interface Question {
  text: string;
  type: "text" | "multiple-choice" | "true-false";
  options?: string[];
}

interface FormState {
  id: string; // Added ID for the form itself
  title: string;
  description: string;
  questions: Question[];
  allow_anonymous: boolean;
}

// Added for chat
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DemoFormPageProps {
  params: Promise<{
    demoFormId: string;
  }>;
}

export default function DemoFormPage({ params }: DemoFormPageProps) {
  const { demoFormId } = use(params);
  const [formDefinition, setFormDefinition] = useState<FormState | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  // State for chat interface
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to the demo form! You can ask me questions about this form or for help filling it out.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const loadFormDefinition = () => {
      setIsLoading(true);
      if (typeof window !== "undefined" && demoFormId) {
        try {
          const storedFormJson = localStorage.getItem(`demoForm-${demoFormId}`);
          if (storedFormJson) {
            const loadedFormState = JSON.parse(storedFormJson);
            setFormDefinition({
              ...loadedFormState,
              id: demoFormId,
            });
            console.log(
              `Loaded form structure for demo ID: ${demoFormId} from localStorage.`
            );
          } else {
            console.warn(
              `No form data found in localStorage for demo ID: ${demoFormId}`
            );
            setFormDefinition(null);
            toast("Could not find demo form data. Please create it first.");
          }
        } catch (error) {
          console.error(
            `Error loading or parsing form data from localStorage for demo ID: ${demoFormId}`,
            error
          );
          setFormDefinition(null);
          toast.error("Failed to load demo form data.");
        }
      } else {
        // Handle cases where demoFormId is not available or localStorage is not accessible (should be rare if component mounts correctly)
        setFormDefinition(null);
      }
      setIsLoading(false);
    };

    loadFormDefinition();

    // Simulate fetching form structure based on demoFormId - OLD MOCK LOGIC REMOVED
    // console.log(`Fetching (simulated) form structure for demo ID: ${demoFormId}`);
    // setIsLoading(true);
    // setTimeout(() => {
    //   setFormDefinition({
    //     id: demoFormId,
    //     title: `Demo Form: ${demoFormId}`,
    //     description: "This is a dynamically generated demo form. Please fill it out.",
    //     questions: [
    //       { text: "What is your name?", type: "text" },
    //       { text: "Your favorite color?", type: "text" },
    //       {
    //         text: "Choose an option:",
    //         type: "multiple-choice",
    //         options: ["Option A", "Option B", "Option C"],
    //       },
    //       { text: "Is this a demo?", type: "true-false" },
    //     ],
    //     allow_anonymous: true,
    //   });
    //   setIsLoading(false);
    // }, 500);
  }, [demoFormId]);

  const handleInputChange = (questionText: string, value: any) => {
    setFormData((prev) => ({ ...prev, [questionText]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);
    console.log("Submitting demo form data:", formData);

    try {
      const response = await fetch(`/demo/${demoFormId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ responses: formData }), // Structure your payload as needed
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message || "Demo form submitted successfully!");
        setSubmissionResult(`Success: ${result.message}`);
        setFormData({}); // Clear form
      } else {
        throw new Error(result.message || "Failed to submit demo form.");
      }
    } catch (error: any) {
      console.error("Demo form submission error:", error);
      toast.error(error.message || "An error occurred during submission.");
      setSubmissionResult(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || !formDefinition) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Updated to call the new endpoint and send appropriate data
      const response = await fetch("/api/demo-fill-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          formDefinition: formDefinition, // Send the whole form definition
          currentAnswers: formData, // Send current answers (formData state)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Chat API request failed with status: " + response.status,
        }));
        throw new Error(
          errorData.error || "Failed to get response from chat API"
        );
      }

      const data = await response.json();
      const assistantMessageContent = data.message;

      let messageToDisplay = assistantMessageContent;
      let updatedAnswers = false;
      let jsonToParse = null;

      // 1. Try to extract from ```json ... ``` code block first
      const markdownJsonMatch = assistantMessageContent.match(
        /\`\`\`(?:json)?\s*(\{[\s\S]+?\})\s*\`\`\`/
      );

      if (markdownJsonMatch && markdownJsonMatch[1]) {
        jsonToParse = markdownJsonMatch[1];
        console.log("Extracted JSON from markdown block:", jsonToParse);
      } else {
        // 2. Fallback: if no markdown, try to find a JSON-like block
        const generalJsonMatch = assistantMessageContent.match(/(\{[\s\S]+\})/);
        if (generalJsonMatch && generalJsonMatch[1]) {
          jsonToParse = generalJsonMatch[1];
          console.log("Extracted JSON using general regex:", jsonToParse);
        }
      }

      if (jsonToParse) {
        try {
          const parsedJson = JSON.parse(jsonToParse);
          console.log("Successfully parsed JSON:", parsedJson);
          console.log(
            "Form definition questions length:",
            formDefinition.questions.length
          );
          console.log(
            "AI answers array length:",
            parsedJson.answers ? parsedJson.answers.length : "N/A"
          );

          if (
            parsedJson.answers &&
            Array.isArray(parsedJson.answers) &&
            formDefinition.questions.length === parsedJson.answers.length
          ) {
            console.log("Lengths match! Proceeding to update formData.");
            const newFormData = { ...formData };
            formDefinition.questions.forEach((question, index) => {
              // Ensure the answer from AI is not undefined before assigning
              const aiAnswer = parsedJson.answers[index];
              console.log(
                `Mapping Q${index + 1} ('${
                  question.text
                }') to AI answer: '${aiAnswer}'`
              );
              if (aiAnswer !== undefined) {
                // Could also check if it's a string or boolean based on question type if stricter
                newFormData[question.text] = aiAnswer;
              }
            });
            setFormData(newFormData);
            messageToDisplay =
              "I've updated the form with your answers! Feel free to review or ask for more changes.";
            updatedAnswers = true;
            toast.success("AI has updated your answers in the form.");
          } else if (parsedJson.answers) {
            console.warn(
              "Parsed JSON, but answers array was malformed or length mismatched.",
              {
                expectedLength: formDefinition.questions.length,
                actualLength: parsedJson.answers.length,
                answers: parsedJson.answers,
              }
            );
            messageToDisplay = assistantMessageContent;
          } else {
            console.warn(
              "Parsed JSON, but it did not contain an 'answers' array.",
              parsedJson
            );
            messageToDisplay = assistantMessageContent;
          }
        } catch (parseError) {
          console.error(
            "Error parsing AI response JSON:",
            parseError,
            "Attempted to parse:",
            jsonToParse
          );
          messageToDisplay = assistantMessageContent;
        }
      } else {
        console.log(
          "No JSON block found in AI message. Displaying raw message."
        );
        messageToDisplay = assistantMessageContent;
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: messageToDisplay },
      ]);
    } catch (error: any) {
      toast.error(error.message || "Failed to get chat response.");
      console.error("Chat submission error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            error.message || "Could not connect to AI assistant."
          }`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading demo form...</div>;
  }

  if (!formDefinition) {
    return (
      <div className="container mx-auto py-8">
        Demo form not found or failed to load.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Main grid for two-column layout on md screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Display Column */}
        <div className="max-w-2xl mx-auto md:mx-0 w-full bg-white p-6 md:p-8 rounded-lg shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {formDefinition.title}
          </h1>
          <p className="text-gray-600 mb-6">{formDefinition.description}</p>

          {submissionResult && (
            <div
              className={`p-4 mb-4 rounded-md ${
                submissionResult.startsWith("Error")
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {submissionResult}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formDefinition.questions.map((q, index) => (
              <div key={index} className="p-4 border rounded-md bg-gray-50">
                <Label className="block text-lg font-semibold mb-2">
                  {q.text}
                </Label>
                {q.type === "text" && (
                  <Input
                    type="text"
                    onChange={(e) => handleInputChange(q.text, e.target.value)}
                    value={formData[q.text] || ""}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                )}
                {q.type === "true-false" && (
                  <RadioGroup
                    onValueChange={(value) => handleInputChange(q.text, value)}
                    value={formData[q.text]}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`q-${index}-true`} />
                      <Label htmlFor={`q-${index}-true`}>True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`q-${index}-false`} />
                      <Label htmlFor={`q-${index}-false`}>False</Label>
                    </div>
                  </RadioGroup>
                )}
                {q.type === "multiple-choice" && q.options && (
                  <RadioGroup
                    onValueChange={(value) => handleInputChange(q.text, value)}
                    value={formData[q.text]}
                    disabled={isSubmitting}
                  >
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={opt}
                          id={`q-${index}-opt-${optIndex}`}
                        />
                        <Label htmlFor={`q-${index}-opt-${optIndex}`}>
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}
            <Button
              type="submit"
              className="w-full text-lg py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit Demo Response"
              )}
            </Button>
          </form>
        </div>

        {/* Chat Interface Column */}
        <div className="space-y-4 md:sticky md:top-8 h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] flex flex-col bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">AI Assistant</h3>
          <ScrollArea className="flex-grow rounded-md border p-4 h-0 min-h-[300px]">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {/* Basic newline handling, consider a markdown renderer for more complex content */}
                  {message.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
          <form onSubmit={handleChatSubmit} className="flex gap-2 pt-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this form..."
              disabled={isChatLoading || !formDefinition}
              className="flex-grow"
            />
            <Button type="submit" disabled={isChatLoading || !formDefinition}>
              {isChatLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
