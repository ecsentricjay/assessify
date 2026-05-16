// app/admin/institutions/page.tsx
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { getAllInstitutions } from '@/lib/actions/institution.actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { InstitutionsTable } from '@/components/admin/institutions-table'
import { Building2, Users, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Institutions | Assessify Admin',
}

export default async function AdminInstitutionsPage() {
  await requireAdmin()

  const result = await getAllInstitutions()
  const institutions = result.success ? result.institutions : []

  const activeCount = institutions.filter((i: any) => i.licenseActive).length
  const totalStudents = institutions.reduce((sum: number, i: any) => sum + (i.studentCount || 0), 0)
  const totalLecturers = institutions.reduce((sum: number, i: any) => sum + (i.lecturerCount || 0), 0)

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage institutional licenses, pricing, and admins
            </p>
          </div>
          <Link
            href="/admin/institutions/create-admin"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Create Institution Admin
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Institutions',
              value: institutions.length,
              icon: <Building2 className="h-5 w-5 text-blue-500" />,
              bg: 'bg-blue-50',
            },
            {
              label: 'Active Licenses',
              value: activeCount,
              icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
              bg: 'bg-green-50',
            },
            {
              label: 'Total Students',
              value: totalStudents.toLocaleString(),
              icon: <Users className="h-5 w-5 text-purple-500" />,
              bg: 'bg-purple-50',
            },
            {
              label: 'Total Lecturers',
              value: totalLecturers.toLocaleString(),
              icon: <Users className="h-5 w-5 text-orange-500" />,
              bg: 'bg-orange-50',
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Institutions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Institutions</CardTitle>
            <CardDescription>
              Click Configure on any institution to set pricing and lecturer earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InstitutionsTable institutions={institutions} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}