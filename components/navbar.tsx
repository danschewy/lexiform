"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Don't show navbar on landing, login, or signup pages
  if (
    pathname === "/" ||
    pathname === "/auth/login" ||
    pathname === "/auth/signup"
  ) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center">
          <MessageSquare className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-xl">LexiForm</span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link
            href="/dashboard"
            className={`text-sm ${
              pathname === "/dashboard"
                ? "text-primary font-medium"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/my-responses"
            className={`text-sm ${
              pathname === "/my-responses"
                ? "text-primary font-medium"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            My Responses
          </Link>
          {/* <Link
            href="/forms"
            className={`text-sm ${
              pathname.startsWith("/forms")
                ? "text-primary font-medium"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            Forms
          </Link>
          <Link
            href="/templates"
            className={`text-sm ${
              pathname === "/templates"
                ? "text-primary font-medium"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            Templates
          </Link> */}
        </nav>

        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.email?.split("@")[0]}
                </div>
                <div className="px-2 py-1.5 text-xs text-gray-500">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">Help & Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button>Log in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
