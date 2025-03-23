import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Share2, BarChart3, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface FormCardProps {
  form: {
    id: string
    title: string
    createdAt: string
    responseCount: number
  }
}

export default function FormCard({ form }: FormCardProps) {
  const formattedDate = new Date(form.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{form.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/forms/${form.id}/edit`} className="w-full">
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MessageSquare className="mr-1 h-4 w-4" />
          <span>{form.responseCount} responses</span>
          <span className="mx-2">•</span>
          <span>Created {formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-gray-50 px-6 py-3">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Link href={`/forms/${form.id}/responses`}>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Responses
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

