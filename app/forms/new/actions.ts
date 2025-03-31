"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface Question {
  text: string;
  type: "text" | "multiple-choice" | "true-false";
  options?: string[];
}

export async function createForm(formData: {
  title: string;
  description: string;
  questions: Question[];
  allow_anonymous: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be logged in to create a form");
  }

  // Extract prompts and question types from questions
  const prompts = formData.questions.map((q) => q.text);
  const questionTypes = formData.questions.map((q) => ({
    type: q.type,
    options: q.options,
  }));

  const { data, error } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      prompts: prompts,
      question_types: questionTypes,
      is_active: true,
      allow_anonymous: formData.allow_anonymous,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  return data.id;
}
