// app/admin/partners/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getPartnerById } from '@/lib/actions/partner.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EditPartnerForm from '@/components/admin/edit-partner-form'

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getPartnerById(id)

  if (result.error || !result.data) {
    notFound()
  }

  const partner = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/partners/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Partner</h1>
          <p className="text-muted-foreground">
            Update partner information and settings
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Information</CardTitle>
          <CardDescription>
            Update business details, commission rate, and bank information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditPartnerForm partner={partner} />
        </CardContent>
      </Card>
    </div>
  )
}