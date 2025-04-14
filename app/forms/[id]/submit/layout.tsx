import { createClient } from "@/utils/supabase/server";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get form data
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("title")
    .eq("id", params.id)
    .single();

  return {
    title: form?.title ? `${form.title} - LexiForm` : "Form - LexiForm",
  };
}

export default function FormSubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
