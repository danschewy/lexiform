"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizontal } from "lucide-react"

interface ChatPreviewProps {
  title: string
  prompts: string[]
}

interface Message {
  id: string
  text: string
  sender: "bot" | "user"
}

export default function ChatPreview({ title, prompts }: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "initial", text: prompts[0] || "Welcome to the chat!", sender: "bot" },
  ])
  const [input, setInput] = useState("")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Add bot response after a short delay
    setTimeout(() => {
      const nextPromptIndex = currentPromptIndex + 1

      if (nextPromptIndex < prompts.length) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: prompts[nextPromptIndex],
          sender: "bot",
        }

        setMessages((prev) => [...prev, botMessage])
        setCurrentPromptIndex(nextPromptIndex)
      } else {
        // End of survey
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: "Thank you for completing this survey! Your responses have been recorded.",
          sender: "bot",
        }

        setMessages((prev) => [...prev, botMessage])
      }
    }, 500)
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      <div className="bg-primary p-4 text-primary-foreground">
        <h3 className="font-medium">{title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-white border shadow-sm"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
          />
          <Button size="icon" onClick={handleSendMessage}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

