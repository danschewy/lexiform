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

Important rules for different question types:
- Text questions: Return the user's response as text
- Multiple-choice questions: Return the exact option text that matches one of the predefined options
- True/false questions: Return either "true" or "false" (as strings)

If the user's response doesn't provide enough information for all questions, keep the existing answers for those questions.

Example form with different question types:
{
  "title": "Customer Feedback",
  "prompts": [
    "How would you rate our service?",
    "What was your favorite dish?",
    "Would you recommend us?"
  ],
  "question_types": [
    { "type": "multiple-choice", "options": ["Excellent", "Good", "Fair", "Poor"] },
    { "type": "text" },
    { "type": "true-false" }
  ]
}

Example user response: "The service was excellent, I loved the pasta dish, and I would definitely recommend this place to others."
Example response: {
  "answers": [
    "Excellent",
    "I loved the pasta dish",
    "true"
  ]
}

Always respond with valid JSON when updating answers. You can also provide explanations or suggestions in natural language before or after the JSON.`;

export async function POST(req: Request) {
  try {
    console.log("Received request to /api/form-submit");
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { messages, formData, currentAnswers } = body;

    if (!messages || !formData || !currentAnswers) {
      console.log("Missing required fields:", {
        messages,
        formData,
        currentAnswers,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Calling OpenAI API...");
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

    console.log("OpenAI API response:", JSON.stringify(response, null, 2));
    const message = response.choices[0].message.content;

    if (!message) {
      console.log("No message in OpenAI response");
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    console.log("Sending response:", { message });
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Form submission API error:", error);

    // Handle OpenAI API errors
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
