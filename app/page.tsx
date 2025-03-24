"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  BarChart3,
  Zap,
  User,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";

export default function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-xl">ChatForms</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              Introducing ChatForms
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              AI-native forms that are{" "}
              <span className="text-primary">purely conversational</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create surveys that feel like natural conversations. No more
              boring forms - just chat with your respondents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="px-8">
                      Get started for free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="px-8">
                      View demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why choose ChatForms?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Conversational Experience
                </h3>
                <p className="text-gray-600">
                  Create forms that feel like natural conversations, not
                  clinical questionnaires.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quick Setup</h3>
                <p className="text-gray-600">
                  Just write your questions - no need to configure complex form
                  fields.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Better Insights</h3>
                <p className="text-gray-600">
                  Get more thoughtful responses and higher completion rates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to transform your surveys?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who are getting better responses with
              ChatForms.
            </p>
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="px-8">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="px-8">
                  Create your first form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              What our users say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600 mb-4">
                  "ChatForms has completely changed how we collect customer
                  feedback. Our response rates have increased by 40% since
                  switching!"
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">
                      Product Manager, TechCorp
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600 mb-4">
                  "Setting up surveys used to take hours. With ChatForms, I can
                  create engaging forms in minutes. The conversational format
                  gets us much better insights."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Michael Chen</p>
                    <p className="text-sm text-gray-500">
                      UX Researcher, DesignHub
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <MessageSquare className="h-5 w-5 text-primary mr-2" />
              <span className="font-bold">ChatForms</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-600 hover:text-primary">
                About
              </Link>
              <Link href="#" className="text-gray-600 hover:text-primary">
                Features
              </Link>
              <Link href="#" className="text-gray-600 hover:text-primary">
                Pricing
              </Link>
              <Link href="#" className="text-gray-600 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ChatForms. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
