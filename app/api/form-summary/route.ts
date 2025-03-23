import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages);

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content) {
      return new Response("No content to analyze", { status: 400 });
    }

    console.log("Processing message:", lastMessage.content);

    const stream = await streamText({
      model: openai("gpt-4"),
      prompt: lastMessage.content,
      system: `You are a data analyst specializing in form response analysis. Your role is to:

1. Analyze form responses and identify patterns
2. Extract meaningful insights and trends
3. Highlight unique or outlier responses
4. Provide statistical summaries where relevant

Format your analysis with clear sections:

KEY PATTERNS & TRENDS
- List major patterns found across responses
- Include frequency of common answers where applicable

INSIGHTS & THEMES
- Identify recurring themes
- Note any correlations between different answers
- Highlight particularly insightful responses

UNIQUE PERSPECTIVES
- Point out interesting outliers
- Highlight unique viewpoints or approaches
- Note any unexpected combinations of answers

STATISTICAL SUMMARY
- Provide relevant metrics (e.g., response distributions)
- Note any significant clusters or groupings
- Include percentages where meaningful

Keep your analysis clear, concise, and focused on actionable insights.
Use bullet points and clear formatting to make the summary easy to scan.

IMPORTANT: Format your response in Markdown for better readability.`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    console.log("Stream created, sending response");
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Error in form summary:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
