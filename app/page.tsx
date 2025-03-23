import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, BarChart3 } from "lucide-react"
import FormCard from "@/components/form-card"

export default function Home() {
  // In a real app, these would come from a database
  const forms = [
    {
      id: "1",
      title: "Customer Satisfaction Survey",
      createdAt: "2023-11-10T12:00:00Z",
      responseCount: 24,
    },
    {
      id: "2",
      title: "Product Feedback",
      createdAt: "2023-11-05T09:30:00Z",
      responseCount: 17,
    },
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ChatForms</h1>
        <Link href="/forms/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
        <Link href="/forms/new" className="block">
          <div className="border border-dashed border-gray-300 rounded-lg h-full min-h-[200px] flex flex-col items-center justify-center p-6 hover:border-primary hover:bg-gray-50 transition-colors">
            <PlusCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600">Create new form</p>
            <p className="text-sm text-gray-500 text-center mt-2">Start with a blank form or use a template</p>
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <div className="flex items-center mb-4">
          <BarChart3 className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recent Responses</h2>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <p className="text-center text-gray-500 py-8">Responses from your forms will appear here</p>
        </div>
      </div>
    </main>
  )
}

