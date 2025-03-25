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
  "prompts": ["Question 1", "Question 2", ...],
  "allow_anonymous": false
}

You can:
- Create new forms from scratch
- Modify existing forms based on user requests
- Edit specific prompts
- Add or remove prompts
- Change the form title or description

Always respond with valid JSON when making form changes. You can also provide explanations or suggestions in natural language before or after the JSON.

Example user request: "Create a customer feedback form for a restaurant"
Example response: "I'll help you create a customer feedback form. Here's a suggested structure:

{
  "title": "Restaurant Customer Feedback",
  "description": "Help us improve our service by sharing your experience",
  "prompts": [
    "How would you rate your overall dining experience?",
    "What was your favorite dish and why?",
    "How would you rate our service staff?",
    "What could we do to improve your experience?",
    "Would you recommend us to others?"
  ],
  "allow_anonymous": false
}

Feel free to ask if you'd like any adjustments to these questions!"`;

export async function POST(req: Request) {
  try {
    const { messages, formState } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        {
          role: "system",
          content: `Current form state: ${JSON.stringify(formState)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const message = response.choices[0].message.content;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
