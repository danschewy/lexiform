import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This SYSTEM_PROMPT is largely taken from your app/api/form-submit/route.ts
const SYSTEM_PROMPT = `You are a form submission assistant. Your job is to help users fill out forms by converting their natural language responses into structured answers.

When the user provides their answers, you should:
1. Understand their responses
2. Map them to the appropriate form questions (provided as 'Current form')
3. Return a JSON object with the following structure:
{
  "answers": ["Answer 1", "Answer 2", ...]
}

The answers array should match the length of the form's questions/prompts array, with each answer corresponding to the question at the same index.

Important rules for different question types:
- Text questions: Return the user's response as text
- Multiple-choice questions: Return the exact option text that matches one of the predefined options for that question.
- True/false questions: Return either "true" or "false" (as strings).

If the user's response doesn't provide enough information for all questions, try to keep the existing answers for those questions (provided as 'Current answers') or leave them as they are if no prior answer exists.

Example Current form (this structure will be provided to you):
{
  "title": "Customer Feedback",
  "questions": [
    { "text": "How would you rate our service?", "type": "multiple-choice", "options": ["Excellent", "Good", "Fair", "Poor"] },
    { "text": "What was your favorite dish?", "type": "text" },
    { "text": "Would you recommend us?", "type": "true-false" }
  ]
}

Example Current answers (this will be provided, representing current state of the form):
{
    "How would you rate our service?": "Good",
    "What was your favorite dish?": "",
    "Would you recommend us?": "true"
}

Example user chat: "Actually, for the service, I'd say it was Poor. And the dish I liked was the salad."
Example JSON response you should provide:
{
  "answers": [
    "Poor", // Updated based on user chat
    "The salad I liked was the salad.", // Updated based on user chat
    "true" // Kept from currentAnswers as user didn't mention it
  ]
}

Always respond with ONLY the valid JSON when an update to answers is made. The JSON object must be strictly valid and must NOT contain any comments. If you are just chatting or can't make an update, respond with plain text without JSON.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // For demo, we expect formDefinition (structure of the form) and currentAnswers (current state of filled fields)
    const { messages, formDefinition, currentAnswers } = body;

    if (!messages || !formDefinition || !currentAnswers) {
      return NextResponse.json(
        {
          error:
            "Demo Fill Assist: Missing required fields (messages, formDefinition, or currentAnswers)",
        },
        { status: 400 }
      );
    }

    // Construct a system message that includes the form structure and current answers state
    // Note: currentAnswers on the client is an object { [questionText]: answer },
    // but the AI prompt expects an array of answers. We'll let the AI handle the mapping based on question text for now,
    // or this could be pre-processed here if needed.
    // For simplicity with the prompt, we'll pass currentAnswers as is, but structure it well in the prompt.

    let currentAnswersString = "No answers yet.";
    if (
      formDefinition.questions &&
      typeof currentAnswers === "object" &&
      Object.keys(currentAnswers).length > 0
    ) {
      currentAnswersString = formDefinition.questions
        .map((q: { text: string }) => {
          const answer = currentAnswers[q.text] || "(empty)";
          return `- ${q.text}: ${answer}`;
        })
        .join("\n");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or your preferred model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages, // User and previous assistant messages
        {
          role: "system",
          content: `Current form definition:\n${JSON.stringify(
            formDefinition,
            null,
            2
          )}

Log of current answers provided by user so far:\n${currentAnswersString}`,
        },
      ],
      temperature: 0.5, // Adjusted for more deterministic answer formatting
      max_tokens: 1000,
    });

    const message = response.choices[0].message.content;

    if (!message) {
      return NextResponse.json(
        { error: "Demo Fill Assist: No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Demo Fill Assist API error:", error);
    let errorMessage = "Failed to process demo fill assist request";
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "AI service configuration error (Demo Fill Assist)";
      } else {
        errorMessage = error.message;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
