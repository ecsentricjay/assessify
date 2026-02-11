// app/admin/users/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { getUserById } from '@/lib/actions/admin-users.actions'
import { AdminHeader } from '@/components/admin/admin-header'
import { UserDetailTabs } from '@/components/admin/user-detail-tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = await requireAdmin()
  
  console.log('User ID from params:', id) // Debug log
  
  const result = await getUserById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { profile, wallet, stats } = result.data

  const getRoleBadge = (role: string) => {
    const colors = {
      student: 'bg-blue-100 text-blue-700',
      lecturer: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
      partner: 'bg-orange-100 text-orange-700'
    }
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader 
        title="User Details" 
        description="View and manage user information"
        adminName={`${admin.profile.first_name} ${admin.profile.last_name}`}
        adminEmail={admin.email || ''}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>

          {/* User Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    {getRoleBadge(profile.role)}
                    <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                    <div className="min-w-0">
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium truncate" title={profile.email}>{profile.email}</p>
                    </div>
                    
                    {profile.matric_number && (
                      <div className="min-w-0">
                        <p className="text-gray-500">Matric Number</p>
                        <p className="font-medium">{profile.matric_number}</p>
                      </div>
                    )}
                    
                    {profile.staff_id && (
                      <div className="min-w-0">
                        <p className="text-gray-500">Staff ID</p>
                        <p className="font-medium">{profile.staff_id}</p>
                      </div>
                    )}
                    
                    {profile.department && (
                      <div className="min-w-0">
                        <p className="text-gray-500">Department</p>
                        <p className="font-medium">{profile.department}</p>
                      </div>
                    )}
                    
                    {profile.phone && (
                      <div className="min-w-0">
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  {profile.role === 'student' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{stats.enrollments}</p>
                        <p className="text-xs text-gray-600">Enrollments</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{stats.submissions}</p>
                        <p className="text-xs text-gray-600">Submissions</p>
                      </div>
                    </>
                  )}
                  
                  {profile.role === 'lecturer' && (
                    <>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">{stats.coursesCreated}</p>
                        <p className="text-xs text-gray-600">Courses</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-orange-700">
                          ₦{wallet?.balance?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-600">Balance</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <UserDetailTabs 
            profile={profile}
            wallet={wallet}
            stats={stats}
          />
        </div>
      </main>
    </div>
  )
}