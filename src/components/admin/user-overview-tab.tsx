// components/admin/user-overview-tab.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Mail, UserX, UserCheck, Key } from 'lucide-react'
import { EditUserModal } from './edit-user-modal'
import { toggleUserStatus, sendPasswordReset } from '@/lib/actions/admin-users.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UserOverviewTabProps {
  profile: any
  stats: any
}

export function UserOverviewTab({ profile, stats }: UserOverviewTabProps) {
  const router = useRouter()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [actionDialog, setActionDialog] = useState<'status' | 'password' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      const result = await toggleUserStatus(profile.id, !profile.is_active)
      if (result.success) {
        toast.success(
          profile.is_active 
            ? 'User deactivated successfully' 
            : 'User activated successfully'
        )
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
      setActionDialog(null)
    }
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    try {
      const result = await sendPasswordReset(profile.id)
      if (result.success) {
        toast.success('Password reset email sent successfully')
      } else {
        toast.error(result.error || 'Failed to send password reset')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
      setActionDialog(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>User account details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{profile.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{profile.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{profile.role}</p>
                </div>
                {profile.matric_number && (
                  <div>
                    <p className="text-sm text-gray-500">Matric Number</p>
                    <p className="font-medium">{profile.matric_number}</p>
                  </div>
                )}
                {profile.staff_id && (
                  <div>
                    <p className="text-sm text-gray-500">Staff ID</p>
                    <p className="font-medium">{profile.staff_id}</p>
                  </div>
                )}
                {profile.department && (
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{profile.department}</p>
                  </div>
                )}
                {profile.faculty && (
                  <div>
                    <p className="text-sm text-gray-500">Faculty</p>
                    <p className="font-medium">{profile.faculty}</p>
                  </div>
                )}
                {profile.level && (
                  <div>
                    <p className="text-sm text-gray-500">Level</p>
                    <p className="font-medium">{profile.level}</p>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>User activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.role === 'student' && (
                  <>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{stats.enrollments}</p>
                      <p className="text-sm text-gray-600">Enrollments</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{stats.submissions}</p>
                      <p className="text-sm text-gray-600">Submissions</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">{stats.testAttempts}</p>
                      <p className="text-sm text-gray-600">Test Attempts</p>
                    </div>
                  </>
                )}
                {profile.role === 'lecturer' && (
                  <>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">{stats.coursesCreated}</p>
                      <p className="text-sm text-gray-600">Courses Created</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActionDialog('password')}
              >
                <Key className="h-4 w-4 mr-2" />
                Send Password Reset
              </Button>

              {profile.is_active ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => setActionDialog('status')}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 hover:text-green-700"
                  onClick={() => setActionDialog('status')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate User
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={profile}
      />

      {/* Status Confirmation Dialog */}
      <AlertDialog 
        open={actionDialog === 'status'} 
        onOpenChange={() => setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {profile.is_active ? 'Deactivate' : 'Activate'} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {profile.is_active ? 'deactivate' : 'activate'}{' '}
              {profile.first_name} {profile.last_name}?
              {profile.is_active && ' They will not be able to log in while inactive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} disabled={loading}>
              {loading ? 'Processing...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog 
        open={actionDialog === 'password'} 
        onOpenChange={() => setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset Email</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to {profile.email}. 
              The user will receive instructions to reset their password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Sending...' : 'Send Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}