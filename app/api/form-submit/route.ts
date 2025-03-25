import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a form submission assistant. Your job is to help users fill out forms by converting their natural language responses into structured answers.

When the user provides their answers, you should:
1. Understand their responses
2. Map them to the appropriate form questions
3. Return a JSON object with the following structure:
{
  "answers": ["Answer 1", "Answer 2", ...]
}

The answers array should match the length of the form's prompts array, with each answer corresponding to the question at the same index.

If the user's response doesn't provide enough information for all questions, keep the existing answers for those questions.

Example user response: "I had a great experience at the restaurant. The service was excellent and the food was delicious. I would definitely recommend it to others."
Example response: {
  "answers": [
    "Great experience",
    "Excellent service and delicious food",
    "Yes, would recommend"
  ]
}

Always respond with valid JSON when updating answers. You can also provide explanations or suggestions in natural language before or after the JSON.`;

export async function POST(req: Request) {
  try {
    const { messages, formData, currentAnswers } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        {
          role: "system",
          content: `Current form: ${JSON.stringify(formData)}
Current answers: ${JSON.stringify(currentAnswers)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const message = response.choices[0].message.content;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Form submission API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
