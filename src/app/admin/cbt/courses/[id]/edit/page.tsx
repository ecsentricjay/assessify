'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseById, updateCourse, createTopic, getTopicsByCourse } from '@/lib/actions/admin-cbt-courses.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  description: string;
  is_active: boolean;
}

interface Topic {
  id: string;
  name: string;
  question_count: number;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [formData, setFormData] = useState<Course | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (course) {
      loadTopics();
    }
  }, [course]);

  async function loadCourse() {
    try {
      setLoading(true);
      const res = await getCourseById(courseId);
      if (res.success && res.course) {
        const courseData = res.course as Course;
        setCourse(courseData);
        setFormData(courseData);
      } else {
        toast.error('Course not found');
        router.push('/admin/cbt/courses');
      }
    } catch (error) {
      console.error('[loadCourse]', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  async function loadTopics() {
    try {
      const res = await getTopicsByCourse(courseId);
      if (res.success && res.topics) {
        setTopics(res.topics as Topic[]);
      }
    } catch (error) {
      console.error('[loadTopics]', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData || !formData.courseCode || !formData.courseTitle) {
      toast.error('Course code and title are required');
      return;
    }

    setSubmitting(true);
    const res = await updateCourse(courseId, {
      courseCode: formData.courseCode,
      courseTitle: formData.courseTitle,
      description: formData.description,
    });

    if (res.success) {
      toast.success('Course updated successfully!');
      router.push('/admin/cbt/courses');
    } else {
      toast.error(res.error || 'Failed to update course');
    }

    setSubmitting(false);
  }

  async function handleAddTopic() {
    if (!newTopicName.trim()) {
      toast.error('Topic name is required');
      return;
    }

    setCreatingTopic(true);
    const res = await createTopic(courseId, newTopicName);

    if (res.success) {
      toast.success('Topic created successfully!');
      setNewTopicName('');
      await loadTopics();
    } else {
      toast.error(res.error || 'Failed to create topic');
    }

    setCreatingTopic(false);
  }

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/cbt/courses" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-gray-600 mt-1">Update course information and manage topics</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Course Details */}
          <Card className="mb-6">
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
                  onChange={(e) =>
                    setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })
                  }
                  required
                  className="mt-2"
                />
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
                  onChange={(e) =>
                    setFormData({ ...formData, courseTitle: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Comprehensive biology practice exam..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">Active (Available for students)</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Course'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/cbt/courses">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Topics Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Topics ({topics.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Topic Form */}
            <div className="flex gap-2">
              <Input
                placeholder="New topic name..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddTopic}
                disabled={creatingTopic}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Topic
              </Button>
            </div>

            {/* Topics List */}
            {topics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No topics yet. Create one to organize questions.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{topic.name}</div>
                      <div className="text-xs text-gray-500">
                        {topic.question_count} question{topic.question_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <Link href={`/admin/cbt/courses/${courseId}/topics/${topic.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href={`/admin/cbt/courses/${courseId}/questions`}>
                View & Manage Questions
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/admin/cbt/courses/${courseId}/questions/create`}>
                Add New Question
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/admin/cbt/courses/${courseId}/questions/bulk-upload`}>
                Bulk Upload Questions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
