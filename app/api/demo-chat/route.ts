import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a form builder assistant. Your job is to help users create forms by converting their natural language requests into a structured form format.

When the user makes a request, you should:
1. Understand their requirements
2. Generate or modify a form in JSON format with the following structure:
{
  "title": "Form title",
  "description": "Form description",
  "questions": [
    {
      "text": "Question text",
      "type": "text" | "multiple-choice" | "true-false",
      "options": ["Option 1", "Option 2", ...] // Only for multiple-choice questions
    }
  ],
  "allow_anonymous": false
}

You can:
- Create new forms from scratch
- Modify existing forms based on user requests
- Edit specific questions
- Add or remove questions
- Change the form title or description
- Change question types between text, multiple-choice, and true/false
- Add or modify options for multiple-choice questions

Always respond with valid JSON when making form changes. You can also provide explanations or suggestions in natural language before or after the JSON.
Make sure the "type" in questions is one of "text", "multiple-choice", or "true-false".

Example user request: "Create a customer feedback form for a restaurant"
Example response: "I'll help you create a customer feedback form. Here's a suggested structure:

{
  "title": "Restaurant Customer Feedback",
  "description": "Help us improve our service by sharing your experience",
  "questions": [
    {
      "text": "How would you rate your overall dining experience?",
      "type": "multiple-choice",
      "options": ["Excellent", "Good", "Fair", "Poor"]
    },
    {
      "text": "What was your favorite dish and why?",
      "type": "text"
    },
    {
      "text": "How would you rate our service staff?",
      "type": "multiple-choice",
      "options": ["Excellent", "Good", "Fair", "Poor"]
    },
    {
      "text": "What could we do to improve your experience?",
      "type": "text"
    },
    {
      "text": "Would you recommend us to others?",
      "type": "true-false"
    }
  ],
  "allow_anonymous": false
}

Feel free to ask if you'd like any adjustments to these questions!"`;

export async function POST(req: Request) {
  try {
    const { messages, formState } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        {
          role: "system",
          content: `Current form state: ${JSON.stringify(formState)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500, // Slightly increased max_tokens just in case for varied demo use
    });

    const message = response.choices[0].message.content;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Demo Chat API error:", error); // Log with a demo-specific prefix
    return NextResponse.json(
      { error: "Failed to process demo chat request" }, // Demo-specific error message
      { status: 500 }
    );
  }
}
