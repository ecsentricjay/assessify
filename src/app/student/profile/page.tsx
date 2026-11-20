'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updateProfile, upgradeToUniversityStudent } from '@/lib/actions/auth.actions'
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
  const [institutions, setInstitutions] = useState<any[]>([])
  const [upInst, setUpInst] = useState('')
  const [upLevel, setUpLevel] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [upError, setUpError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/institutions').then((r) => r.json()).then((d) => setInstitutions(d.institutions || [])).catch(() => {})
  }, [])

  async function handleUpgrade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUpError(null)
    if (!upInst || !upLevel) return setUpError('Select your institution and level')
    if (!window.confirm('Switch to a full university student account? Your JAMB practice history and wallet are kept, but this menu will change.')) return
    setUpgrading(true)
    const fd = new FormData(e.currentTarget)
    const res = await upgradeToUniversityStudent({
      institutionId: upInst,
      matricNumber: fd.get('matric') as string,
      level: parseInt(upLevel),
      faculty: fd.get('faculty') as string,
      department: fd.get('department') as string,
    })
    setUpgrading(false)
    if (res.error) return setUpError(res.error)
    router.push('/student/dashboard')
    router.refresh()
  }

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
    
    if (profile?.student_type === 'jambite') {
      const result = await updateProfile({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        phone: formData.get('phone') as string,
        jambInstitutions: [formData.get('inst1') as string, formData.get('inst2') as string],
        jambCourses: [formData.get('course1') as string, formData.get('course2') as string],
      })
      if (result.error) setError(result.error)
      else {
        setSuccess(result.message || 'Profile updated successfully!')
        setTimeout(() => router.push('/student/dashboard'), 1500)
      }
      setLoading(false)
      return
    }

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

              {profile.student_type !== 'jambite' && (
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

              )}

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

              {profile.student_type === 'jambite' && (
                <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="space-y-2">
                    <Label>Institutions you want to attend (1st required)</Label>
                    <Input name="inst1" defaultValue={profile.jamb_institution_1 ?? ''} required maxLength={120} placeholder="1st choice" />
                    <Input name="inst2" defaultValue={profile.jamb_institution_2 ?? ''} maxLength={120} placeholder="2nd choice (optional)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Courses you want to study (1st required)</Label>
                    <Input name="course1" defaultValue={profile.jamb_course_1 ?? ''} required maxLength={120} placeholder="1st choice" />
                    <Input name="course2" defaultValue={profile.jamb_course_2 ?? ''} maxLength={120} placeholder="2nd choice (optional)" />
                  </div>
                </div>
              )}

              {profile.student_type !== 'jambite' && (
              <>
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

              </>
              )}

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

        {profile.student_type === 'jambite' && (
          <Card className="mt-6 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-xl">🎓 Got admission?</CardTitle>
              <p className="text-sm text-gray-600">Switch to a full student account to use courses, assignments, tests and CA scores. Your JAMB practice history and wallet stay with you.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpgrade} className="space-y-4">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select value={upInst} onValueChange={setUpInst}>
                    <SelectTrigger><SelectValue placeholder="Select your institution" /></SelectTrigger>
                    <SelectContent>
                      {institutions.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matric">Matric Number</Label>
                    <Input id="matric" name="matric" required placeholder="2026/123456" />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={upLevel} onValueChange={setUpLevel}>
                      <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                      <SelectContent>
                        {['100', '200', '300', '400', '500'].map((l) => (<SelectItem key={l} value={l}>{l} Level</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="up-faculty">Faculty</Label>
                    <Input id="up-faculty" name="faculty" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="up-department">Department</Label>
                    <Input id="up-department" name="department" required />
                  </div>
                </div>
                {upError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{upError}</div>}
                <Button type="submit" disabled={upgrading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {upgrading ? 'Upgrading...' : 'Upgrade to full student account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}