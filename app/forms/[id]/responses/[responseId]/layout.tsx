import { createClient } from "@/utils/supabase/server";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { id: string; responseId: string };
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = await createClient();

  // Get form title
  const { data: form } = await supabase
    .from("forms")
    .select("title")
    .eq("id", params.id)
    .single();

  return {
    title: form?.title
      ? `Response - ${form.title} - LexiForm`
      : "Response - LexiForm",
  };
}

export default function ResponseLayout({ children }: Props) {
  return children;
}
