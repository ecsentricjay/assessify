'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse } from '@/lib/actions/admin-cbt-courses.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseTitle: '',
    description: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.courseCode || !formData.courseTitle) {
      toast.error('Course code and title are required');
      return;
    }

    setLoading(true);
    const res = await createCourse(formData);

    if (res.success) {
      toast.success('Course created successfully!');
      router.push('/admin/cbt/courses');
    } else {
      toast.error(res.error || 'Failed to create course');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/cbt/courses" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create CBT Course</h1>
          <p className="text-gray-600 mt-1">Add a new practice course to the system</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Code */}
              <div>
                <Label htmlFor="courseCode" className="text-base font-medium">
                  Course Code *
                </Label>
                <Input
                  id="courseCode"
                  placeholder="e.g., CBT-BIOLOGY-101"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                  required
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Unique identifier for the course</p>
              </div>

              {/* Course Title */}
              <div>
                <Label htmlFor="courseTitle" className="text-base font-medium">
                  Course Title *
                </Label>
                <Input
                  id="courseTitle"
                  placeholder="e.g., Biology Practice Exam"
                  value={formData.courseTitle}
                  onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                  required
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Display name for students</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Comprehensive biology practice exam covering photosynthesis, cell biology, genetics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Optional description for students</p>
              </div>

              {/* Info Box */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 text-sm text-blue-900">
                  <p>
                    <strong>Next Steps:</strong> After creating this course, you'll be able to add topics and questions.
                  </p>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/cbt/courses">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
