import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using LexiForm, you agree to be bound by these
            Terms of Service. If you do not agree with any part of these terms,
            please do not use our service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            LexiForm provides a platform for creating, managing, and analyzing
            forms using artificial intelligence. Our service includes:
          </p>
          <ul>
            <li>Form creation and customization</li>
            <li>AI-powered form analysis</li>
            <li>Response collection and management</li>
            <li>Data visualization and insights</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>To use our service, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Register for an account with valid information</li>
            <li>Maintain the security of your account</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>

          <h2>4. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Use the service in compliance with applicable laws</li>
            <li>Not use the service for any illegal purposes</li>
            <li>Not interfere with the proper working of the service</li>
            <li>Not attempt to access unauthorized areas of the service</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality
            are owned by LexiForm and are protected by international copyright,
            trademark, and other intellectual property laws.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            LexiForm shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or
            inability to use the service.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these terms at any time.
            We will notify users of any material changes via email or through
            the service.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us at:
            <br />
            Email: legal@aiformbuilder.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
