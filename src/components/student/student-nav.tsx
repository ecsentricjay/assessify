// src/components/student/student-nav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Home,
  BookOpen,
  FileText,
  Key,
  BarChart3,
  Wallet,
  Settings,
  Sparkles
} from 'lucide-react'

const navItems = [
  { 
    href: '/student/dashboard', 
    label: 'Dashboard', 
    icon: Home 
  },
  { 
    href: '/student/courses', 
    label: 'My Courses', 
    icon: BookOpen 
  },
  { 
    href: '/student/assignments', 
    label: 'Assignments', 
    icon: FileText 
  },
  { 
    href: '/student/assignments/access', 
    label: 'Enter Code', 
    icon: Key, 
    highlight: true 
  },
  { 
    href: '/student/assignment-writer', 
    label: 'AI Writer', 
    icon: Sparkles, 
    isNew: true,
    description: 'Generate assignments with AI' 
  },
  { 
    href: '/student/scores', 
    label: 'CA Scores', 
    icon: BarChart3 
  },
  { 
    href: '/student/wallet', 
    label: 'Wallet', 
    icon: Wallet 
  },
  { 
    href: '/student/profile', 
    label: 'Profile', 
    icon: Settings 
  },
]

export default function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'relative whitespace-nowrap',
                item.highlight && !isActive && 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100',
                item.isNew && !isActive && 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20'
              )}
              title={item.description}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.isNew && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 px-1.5 py-0 text-[10px] bg-primary text-primary-foreground"
                >
                  NEW
                </Badge>
              )}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}