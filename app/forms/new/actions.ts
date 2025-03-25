"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createForm(formData: {
  title: string;
  description: string;
  prompts: string[];
  allow_anonymous: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be logged in to create a form");
  }

  const { data, error } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      prompts: formData.prompts,
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
