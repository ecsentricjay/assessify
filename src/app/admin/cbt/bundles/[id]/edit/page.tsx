import AdminBundleForm from '@/components/admin/cbt/AdminBundleForm'
import { getBundleById } from '@/lib/actions/admin-cbt-bundles.actions'
import { getAllCourses } from '@/lib/actions/admin-cbt-courses.actions'

export default async function EditBundlePage({ params }: { params: { id: string } }) {
  const [bundleResult, coursesResult] = await Promise.all([
    getBundleById(params.id),
    getAllCourses(),
  ])

  if (!bundleResult.success) {
    return <div>Bundle not found</div>
  }

  const courses = coursesResult.success ? coursesResult.courses || [] : []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 p-8">Edit CBT Bundle</h1>
      <AdminBundleForm
        mode="edit"
        bundle={bundleResult.bundle}
        courses={courses}
      />
    </div>
  )
}
