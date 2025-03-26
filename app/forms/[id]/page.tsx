"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Share2,
  MessageSquare,
  Check,
  Copy,
  Trash2,
  Edit2,
  Eye,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import type { Database } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Form = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  prompts: string[];
  user_id: string;
  is_active: boolean;
  allow_anonymous: boolean;
};
type Response = Database["public"]["Tables"]["responses"]["Row"];

interface FormPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FormPage({ params }: FormPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setForm(data);

        // Fetch recent responses
        const { data: responsesData, error: responsesError } = await supabase
          .from("responses")
          .select("*")
          .eq("form_id", id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (responsesError) throw responsesError;
        setResponses(responsesData || []);
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, supabase]);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/forms/${id}/submit`);
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDeleteForm = async () => {
    try {
      setIsDeleting(true);

      // First delete all responses
      const { error: responsesError } = await supabase
        .from("responses")
        .delete()
        .eq("form_id", id);

      if (responsesError) throw responsesError;

      // Then delete the form
      const { error: formError } = await supabase
        .from("forms")
        .delete()
        .eq("id", id);

      if (formError) throw formError;

      toast.success("Form and responses deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Form not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <div className="ml-auto flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Form</DialogTitle>
                <DialogDescription>
                  Share this link with others to collect responses
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} />
                <Button onClick={handleCopyLink} variant="outline" size="icon">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link href={`/forms/${form.id}/responses`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Responses
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-100"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Form
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot be
              undone, and all responses will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteForm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>View and edit your form details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">
                {form.description || "No description provided"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1">
                {new Date(form.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">{form.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Allow Anonymous Submissions
              </h3>
              <p className="mt-1">{form.allow_anonymous ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.prompts.map((prompt, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Prompt {index + 1}</p>
                    <p className="mt-1 text-sm text-gray-600">{prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest submissions to your form</CardDescription>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No responses yet. Share your form to start collecting responses!
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(response.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                      <Link
                        href={`/forms/${id}/responses/${response.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(response.answers).map(
                        ([question, answer]) => (
                          <div key={question} className="text-sm">
                            <span className="font-medium">{question}:</span>{" "}
                            <span className="text-gray-600">{answer}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
