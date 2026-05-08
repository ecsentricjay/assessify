'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Edit, 
  Gift,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  total_free_attempts: number
  used_free_attempts: number
  remaining_free_attempts: number
  purchased_attempts: number
  used_paid_attempts: number
  remaining_paid_attempts: number
  total_attempts_used: number
  total_amount_spent: number
  created_at: string
}

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState({
    totalFree: 0,
    purchasedAttempts: 0,
  })

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const response = await fetch('/api/admin/study-aid/students')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStudents(data.students || [])
        }
      }
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(student: Student) {
    setEditingStudent(student)
    setEditForm({
      totalFree: student.total_free_attempts,
      purchasedAttempts: student.purchased_attempts,
    })
  }

  async function handleSaveEdit() {
    if (!editingStudent) return

    try {
      const response = await fetch(`/api/admin/study-aid/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalFreeAttempts: editForm.totalFree,
          purchasedAttempts: editForm.purchasedAttempts,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Student credits updated successfully')
        setEditingStudent(null)
        loadStudents()
      } else {
        toast.error(data.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('An error occurred')
    }
  }

  async function grantFreeAttempts(student: Student, amount: number) {
    try {
      const response = await fetch(`/api/admin/study-aid/students/${student.id}/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts: amount }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Granted ${amount} free attempts to ${student.name}`)
        loadStudents()
      } else {
        toast.error(data.error || 'Failed to grant attempts')
      }
    } catch (error) {
      console.error('Grant error:', error)
      toast.error('An error occurred')
    }
  }

  // Filter students
  const filteredStudents = students.filter((student) => {
    return (
      searchQuery === '' ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-500 animate-pulse">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/admin/study-aid">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
              <CardDescription>Manage student credits and attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Student Name</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Free Attempts</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Paid Attempts</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Used</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Spent</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-sm">{student.name}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm font-semibold">{student.remaining_free_attempts}</div>
                          <div className="text-xs text-gray-500">of {student.total_free_attempts}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm font-semibold">{student.remaining_paid_attempts}</div>
                          <div className="text-xs text-gray-500">of {student.purchased_attempts}</div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-semibold">
                          {student.total_attempts_used}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold">
                          ₦{(student.total_amount_spent || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(student)}
                              className="h-8 w-8 p-0"
                              title="Edit credits"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => grantFreeAttempts(student, 5)}
                              className="h-8 w-8 p-0"
                              title="Grant 5 free attempts"
                            >
                              <Gift className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No students found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Modal */}
          {editingStudent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Edit Student Credits</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingStudent(null)}
                  >
                    ✕
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="font-semibold text-sm">{editingStudent.name}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Total Free Attempts
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editForm.totalFree}
                        onChange={(e) => setEditForm(prev => ({ ...prev, totalFree: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currently used: {editingStudent.used_free_attempts}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Purchased Attempts
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editForm.purchasedAttempts}
                        onChange={(e) => setEditForm(prev => ({ ...prev, purchasedAttempts: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currently used: {editingStudent.used_paid_attempts}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setEditingStudent(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
    </div>
  )
}