import AdminBundleForm from '@/components/admin/cbt/AdminBundleForm'
import { getAllCourses } from '@/lib/actions/admin-cbt-courses.actions'

export default async function CreateBundlePage() {
  const coursesRes = await getAllCourses()
  const courses = coursesRes.success ? coursesRes.courses || [] : []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 p-8">Create CBT Bundle</h1>
      <AdminBundleForm
        mode="create"
        courses={courses}
      />
    </div>
  )
}
