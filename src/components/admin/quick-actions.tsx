// components/admin/quick-actions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { UserPlus, DollarSign, FileText, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      label: 'View All Users',
      icon: Users,
      onClick: () => router.push('/admin/users'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      label: 'Manage Finances',
      icon: DollarSign,
      onClick: () => router.push('/admin/finances'),
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      label: 'View Reports',
      icon: FileText,
      onClick: () => router.push('/admin/reports'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      label: 'Manage Content',
      icon: FileText,
      onClick: () => router.push('/admin/content'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.label}
            variant="outline"
            className={`h-auto py-4 justify-start gap-3 ${action.bgColor} border-0`}
            onClick={action.onClick}
          >
            <div className={`p-2 rounded-lg bg-white ${action.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium text-gray-900">{action.label}</span>
          </Button>
        )
      })}
    </div>
  )
}