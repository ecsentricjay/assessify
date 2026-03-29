// components/admin/admin-header.tsx
'use client'

import { Bell, LogOut, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSidebar } from '@/lib/context/sidebar-context'

interface AdminHeaderProps {
  title: string
  description?: string
  adminName?: string
  adminEmail?: string
}

export function AdminHeader({ 
  title, 
  description,
  adminName,
  adminEmail 
}: AdminHeaderProps) {
  const router = useRouter()
  const { toggle } = useSidebar()

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      toast.error('Failed to sign out')
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="bg-white border-b border-border-gray sticky top-0 z-20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Mobile Menu Button + Title */}
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-text-gray hover:text-foreground hover:bg-bg-light"
              onClick={toggle}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary-dark">{title}</h1>
              {description && (
                <p className="text-sm text-text-gray mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 ml-4">
            <Button variant="ghost" size="icon" className="text-text-gray hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-primary-blue font-semibold text-sm">
                    {adminName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-primary-dark">
                      {adminName || 'Admin'}
                    </p>
                    <p className="text-xs text-text-gray">Administrator</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium text-primary-dark">{adminName || 'Admin'}</p>
                    <p className="text-xs text-text-gray font-normal">{adminEmail || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="text-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-error">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}