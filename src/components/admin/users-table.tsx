// components/admin/users-table.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, UserX, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toggleUserStatus } from '@/lib/actions/admin-users.actions'
import { toast } from 'sonner'
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

type User = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  matric_number: string | null
  staff_id: string | null
  department: string | null
  is_active: boolean
  created_at: string
}

interface UsersTableProps {
  users: User[]
  onRefresh?: () => void
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const router = useRouter()
  const [actionUser, setActionUser] = useState<{ id: string; name: string; action: 'activate' | 'deactivate' } | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleStatusToggle = async () => {
    if (!actionUser) return

    setLoading(true)
    try {
      const result = await toggleUserStatus(
        actionUser.id, 
        actionUser.action === 'activate'
      )

      if (result.success) {
        toast.success(
          actionUser.action === 'activate' 
            ? 'User activated successfully' 
            : 'User deactivated successfully'
        )
        onRefresh?.()
      } else {
        toast.error(result.error || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
      setActionUser(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No users found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      {user.first_name} {user.last_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {user.email}
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-sm">
                  {user.matric_number || user.staff_id || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {user.department || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Navigating to user:', user.id) // Debug log
                        router.push(`/admin/users/${user.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActionUser({ 
                          id: user.id, 
                          name: `${user.first_name} ${user.last_name}`,
                          action: 'deactivate'
                        })}
                      >
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActionUser({ 
                          id: user.id, 
                          name: `${user.first_name} ${user.last_name}`,
                          action: 'activate'
                        })}
                      >
                        <UserCheck className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionUser?.action === 'activate' ? 'Activate' : 'Deactivate'} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionUser?.action} {actionUser?.name}? 
              {actionUser?.action === 'deactivate' && ' They will not be able to log in while inactive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} disabled={loading}>
              {loading ? 'Processing...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}