import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, MessageSquare, User } from "lucide-react"
import Link from "next/link"

interface ResponsesPageProps {
  params: {
    id: string
  }
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  // In a real app, these would come from a database
  const form = {
    id: params.id,
    title: "Customer Satisfaction Survey",
    createdAt: "2023-11-10T12:00:00Z",
    prompts: [
      "Hi there! Thanks for taking this survey. What's your name?",
      "How did you hear about our product?",
      "On a scale of 1-10, how satisfied are you with our service?",
      "What features would you like to see improved?",
      "Any additional comments or feedback for us?",
    ],
  }

  const responses = [
    {
      id: "resp1",
      respondent: "Anonymous User",
      timestamp: "2023-11-15T14:23:00Z",
      answers: [
        "Sarah Johnson",
        "I found you through a Google search",
        "8",
        "I'd like to see faster loading times and more customization options",
        "Overall great product, keep up the good work!",
      ],
    },
    {
      id: "resp2",
      respondent: "Anonymous User",
      timestamp: "2023-11-14T09:45:00Z",
      answers: [
        "Michael Chen",
        "A friend recommended it to me",
        "9",
        "The mobile app could use some improvements",
        "I've been a customer for 2 years and love the service",
      ],
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{form.title}: Responses</h1>
        <Button variant="outline" size="sm" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">{responses.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m 34s</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="individual">
        <TabsList className="mb-6">
          <TabsTrigger value="individual">Individual Responses</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          {responses.map((response, index) => (
            <Card key={response.id}>
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <CardTitle className="text-base font-medium">Response #{index + 1}</CardTitle>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(response.timestamp).toLocaleString()}</div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {form.prompts.map((prompt, i) => (
                    <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="text-sm font-medium text-gray-500 mb-1">{prompt}</div>
                      <div className="pl-4 border-l-2 border-primary">{response.answers[i]}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-12">Response summaries and analytics will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

