import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Form - LexiForm",
};

export default function NewFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
