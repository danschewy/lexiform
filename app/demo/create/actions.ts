"use server";

// Define types similar to the page component for strong typing
interface Question {
  text: string;
  type: "text" | "multiple-choice" | "true-false";
  options?: string[];
}

interface FormState {
  title: string;
  description: string;
  questions: Question[];
  allow_anonymous: boolean;
}

export async function createDemoForm(formState: FormState) {
  console.log(
    "Attempting to create demo form with data:",
    JSON.stringify(formState, null, 2)
  );

  // Basic validation (can be expanded)
  if (!formState.title || formState.title.trim() === "") {
    return { success: false, message: "Title is required." };
  }
  if (!formState.questions || formState.questions.length === 0) {
    return { success: false, message: "At least one question is required." };
  }

  // Simulate database interaction for demo purposes
  const demoFormId = `demo-${Date.now()}`;
  console.log(`Simulated demo form creation. ID: ${demoFormId}`);

  // In a real implementation, you would save to your Supabase database here.
  // For example:
  // const supabase = createServerClient(); // Or your specific Supabase client for server actions
  // const { data, error } = await supabase
  //   .from('demo_forms') // or 'forms' table with an 'is_demo' flag
  //   .insert({
  //     id: demoFormId,
  //     title: formState.title,
  //     description: formState.description,
  //     questions: formState.questions,
  //     allow_anonymous: formState.allow_anonymous,
  //     // user_id: null, // Explicitly null for demo forms
  //     created_at: new Date().toISOString(),
  //   })
  //   .select('id')
  //   .single();
  //
  // if (error) {
  //   console.error("Error saving demo form to DB:", error);
  //   return { success: false, message: `Database error: ${error.message}` };
  // }
  // if (!data) {
  //   return { success: false, message: "Failed to save demo form and get ID." };
  // }

  return {
    success: true,
    message: "Demo form created (simulated successfully)!",
    formId: demoFormId, // Use the generated pseudo-ID
    // formId: data.id, // In real implementation, use the ID from DB
  };
}
