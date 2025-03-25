import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="flex items-center">
            <MessageSquare className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-xl">LexiForm</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8">{children}</div>
      </main>
    </div>
  );
}
