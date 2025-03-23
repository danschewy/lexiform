"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, MessageSquare, ArrowRight, Save } from "lucide-react"
import ChatPreview from "@/components/chat-preview"

export default function NewFormPage() {
  const [title, setTitle] = useState("Untitled Form")
  const [description, setDescription] = useState("")
  const [prompts, setPrompts] = useState([
    { id: "1", text: "Hi there! Thanks for taking this survey. What's your name?" },
    { id: "2", text: "How did you hear about our product?" },
  ])
  const [activePrompt, setActivePrompt] = useState<string | null>("1")

  const addPrompt = () => {
    const newPrompt = {
      id: `prompt-${Date.now()}`,
      text: "Enter your question here...",
    }
    setPrompts([...prompts, newPrompt])
    setActivePrompt(newPrompt.id)
  }

  const updatePrompt = (id: string, text: string) => {
    setPrompts(prompts.map((prompt) => (prompt.id === id ? { ...prompt, text } : prompt)))
  }

  const removePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id))
    if (activePrompt === id) {
      setActivePrompt(prompts[0]?.id || null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Form</h1>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>Set the title and description for your form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
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
                <label htmlFor="description" className="block text-sm font-medium mb-1">
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
              <CardTitle>Conversation Flow</CardTitle>
              <CardDescription>Add prompts that will be presented as a conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 border rounded-md ${
                      activePrompt === prompt.id ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                    onClick={() => setActivePrompt(prompt.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm font-medium">Prompt {prompts.indexOf(prompt) + 1}</span>
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
                    {activePrompt === prompt.id && prompts.indexOf(prompt) < prompts.length - 1 && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setActivePrompt(prompts[prompts.indexOf(prompt) + 1].id)}
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
              <CardDescription>This is how your form will appear to respondents</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ChatPreview title={title} prompts={prompts.map((p) => p.text)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

