import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2>1. Introduction</h2>
          <p>
            LexiForm ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We collect personal information that you provide to us:</p>
          <ul>
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Form responses and submissions</li>
            <li>Usage data and analytics</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our service, we automatically collect:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Usage patterns and preferences</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul>
            <li>Providing and maintaining our service</li>
            <li>Processing form submissions</li>
            <li>Improving user experience</li>
            <li>Sending important updates and notifications</li>
            <li>Analyzing usage patterns</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the internet is
            100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>
            We use third-party services that may collect information about you:
          </p>
          <ul>
            <li>Google Analytics for usage tracking</li>
            <li>Supabase for data storage and authentication</li>
            <li>OpenAI for AI-powered features</li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:
            <br />
            Email: privacy@aiformbuilder.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
