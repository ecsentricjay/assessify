'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updateProfile } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function StudentProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadProfile() {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setProfile(user.profile)
    }
    loadProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
      department: formData.get('department') as string,
      faculty: formData.get('faculty') as string,
      level: parseInt(formData.get('level') as string),
      matricNumber: formData.get('matricNumber') as string,
    }

    const result = await updateProfile(data)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || 'Profile updated successfully!')
      setTimeout(() => router.push('/student/dashboard'), 1500)
    }

    setLoading(false)
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/student/dashboard">
            <Button variant="outline" size="sm">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    defaultValue={profile.first_name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    defaultValue={profile.last_name}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input 
                  id="matricNumber" 
                  name="matricNumber" 
                  defaultValue={profile.matric_number}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">Matric number cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel"
                  defaultValue={profile.phone}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select name="level" defaultValue={profile.level?.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty</Label>
                  <Input 
                    id="faculty" 
                    name="faculty" 
                    defaultValue={profile.faculty}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    name="department" 
                    defaultValue={profile.department}
                    required 
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
                <Link href="/student/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}