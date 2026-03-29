'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getAllCourses, deleteCourse, toggleCourseStatus } from '@/lib/actions/admin-cbt-courses.actions';
import { toast } from 'sonner';

interface Course {
  id: string;
  course_code: string;
  course_title: string;
  description: string;
  question_count: number;
  is_active: boolean;
  created_at: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    setFilteredCourses(
      courses.filter(
        (course) =>
          course.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, courses]);

  async function loadCourses() {
    try {
      setLoading(true);
      const res = await getAllCourses();
      if (res.success && res.courses) {
        setCourses(res.courses as Course[]);
      }
    } catch (error) {
      console.error('[loadCourses]', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(courseId: string) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      setDeleting(courseId);
      const res = await deleteCourse(courseId);
      if (res.success) {
        setCourses(courses.filter((c) => c.id !== courseId));
        toast.success('Course deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete course');
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleStatus(courseId: string) {
    try {
      const res = await toggleCourseStatus(courseId);
      if (res.success) {
        setCourses(
          courses.map((c) => (c.id === courseId ? { ...c, is_active: !c.is_active } : c))
        );
        toast.success('Course status updated');
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('[handleToggleStatus]', error);
      toast.error('Failed to update status');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CBT Courses</h1>
            <p className="text-gray-600 mt-1">Manage all practice courses</p>
          </div>
          <Button asChild>
            <Link href="/admin/cbt/courses/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search courses by title or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No courses found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm">
                      <th className="text-left py-2 px-4">Code</th>
                      <th className="text-left py-2 px-4">Title</th>
                      <th className="text-left py-2 px-4">Description</th>
                      <th className="text-center py-2 px-4">Questions</th>
                      <th className="text-center py-2 px-4">Status</th>
                      <th className="text-right py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="py-3 px-4 font-mono text-gray-700">{course.course_code}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{course.course_title}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {course.description || '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {course.question_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(course.id)}
                            className="inline-flex items-center gap-1 text-sm"
                          >
                            {course.is_active ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Eye className="w-4 h-4" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500">
                                <EyeOff className="w-4 h-4" />
                                Inactive
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/admin/cbt/courses/${course.id}/edit`}>
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(course.id)}
                              disabled={deleting === course.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
