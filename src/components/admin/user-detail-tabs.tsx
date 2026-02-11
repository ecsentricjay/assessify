// components/admin/user-detail-tabs.tsx
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserOverviewTab } from './user-overview-tab'
import { UserActivityTab } from './user-activity-tab'
import { UserFinancialTab } from './user-financial-tab'
import { UserCoursesTab } from './user-courses-tab'

interface UserDetailTabsProps {
  profile: any
  wallet: any
  stats: any
}

export function UserDetailTabs({ profile, wallet, stats }: UserDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const showFinancial = profile.role === 'student' || profile.role === 'lecturer'
  const showCourses = profile.role === 'student' || profile.role === 'lecturer'

  useEffect(() => {
    console.log('UserDetailTabs mounted with:', {
      userId: profile.id,
      userRole: profile.role,
      showCourses,
      stats
    })
  }, [profile, stats, showCourses])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {showFinancial && <TabsTrigger value="financial">Financial</TabsTrigger>}
        {showCourses && <TabsTrigger value="courses">Courses</TabsTrigger>}
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <UserOverviewTab profile={profile} stats={stats} />
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        <UserActivityTab userId={profile.id} />
      </TabsContent>

      {showFinancial && (
        <TabsContent value="financial" className="mt-6">
          <UserFinancialTab 
            userId={profile.id} 
            wallet={wallet}
            userRole={profile.role}
          />
        </TabsContent>
      )}

      {showCourses && (
        <TabsContent value="courses" className="mt-6">
          <UserCoursesTab 
            userId={profile.id}
            userRole={profile.role}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}