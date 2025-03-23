import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("Received request with messages:", messages);

  const stream = await streamText({
    model: openai("gpt-4o-mini"),
    prompt: messages[messages.length - 1].content,
    system: `You are a helpful AI assistant that helps create forms and surveys. 
    When asked to create a form, generate a series of questions based on the user's requirements.
    Format your responses as JSON with the following structure:
    {
      "title": "Form Title",
      "description": "Form Description",
      "prompts": ["Question 1", "Question 2", ...]
    }
    
    If the user wants to edit an existing form, help them modify the questions while maintaining the same structure.
    
    IMPORTANT: Always respond with valid JSON only, no additional text or explanation.`,
  });

  return stream.toDataStreamResponse();
}
