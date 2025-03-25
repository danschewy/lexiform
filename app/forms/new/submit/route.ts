import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, description, prompts, userId, is_active } =
      await request.json();

    // Validate required fields
    if (!title || !prompts || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create admin Supabase client
    const supabase = await createClient();
    // Insert the form using admin client
    const { data, error } = await supabase
      .from("forms")
      .insert({
        title,
        description,
        prompts,
        user_id: userId,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating form:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in create-form route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
