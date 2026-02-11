// app/admin/content/submissions/submissions-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, ClipboardCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SubmissionsClientProps {
  initialSubmissions: any[]
}

export default function SubmissionsClient({
  initialSubmissions = []
}: SubmissionsClientProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'assignment' | 'test'>('all')

  const filteredSubmissions = typeFilter === 'all'
    ? initialSubmissions
    : initialSubmissions.filter(s => s.type === typeFilter)

  const getPlagiarismBadge = (score?: number) => {
    if (!score) return null
    
    if (score >= 70) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        High ({score}%)
      </Badge>
    } else if (score >= 40) {
      return <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
        Medium ({score}%)
      </Badge>
    }
    return <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700">
      Low ({score}%)
    </Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
      graded: { label: 'Graded', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' }
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Submissions ({filteredSubmissions.length})</CardTitle>
          
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
              <SelectItem value="test">Tests</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${
                    submission.type === 'assignment' 
                      ? 'bg-blue-100' 
                      : 'bg-purple-100'
                  }`}>
                    {submission.type === 'assignment' ? (
                      <FileText className={`h-5 w-5 ${
                        submission.type === 'assignment' 
                          ? 'text-blue-600' 
                          : 'text-purple-600'
                      }`} />
                    ) : (
                      <ClipboardCheck className="h-5 w-5 text-purple-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">
                        {submission.type === 'assignment' 
                          ? submission.assignments?.title 
                          : submission.tests?.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {submission.type}
                      </Badge>
                      {submission.is_late && (
                        <Badge variant="destructive" className="text-xs">Late</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {submission.type === 'assignment' 
                        ? submission.assignments?.courses?.course_code 
                        : submission.tests?.courses?.course_code} - {' '}
                      {submission.type === 'assignment' 
                        ? submission.assignments?.courses?.course_title 
                        : submission.tests?.courses?.course_title}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        By: {submission.profiles?.first_name} {submission.profiles?.last_name}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status & Score */}
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(submission.status)}
                  
                  {submission.type === 'assignment' ? (
                    <>
                      {submission.final_score !== null && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {submission.final_score}%
                          </span>
                        </div>
                      )}
                      {submission.plagiarism_score !== null && getPlagiarismBadge(submission.plagiarism_score)}
                    </>
                  ) : (
                    <>
                      {submission.score !== null && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {submission.score}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}