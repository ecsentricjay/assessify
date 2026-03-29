// src/components/providers/auth-provider.tsx - With RLS Error Handling
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient as createClientSideSupabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StudentProfile {
  user_id: string
  class_level?: string
  date_of_birth?: string | null
  sex?: string | null
  school_name?: string | null
  padi_points?: number
  current_streak?: number
  longest_streak?: number
  total_tests_taken?: number
  average_score?: number
  username?: string | null
}

interface TeacherProfile {
  user_id: string
  date_of_birth?: string | null
  sex?: string | null
  school_name?: string | null
  teaching_subjects?: string[] | null
  verification_status?: string
  total_tests_created?: number
  total_students_reached?: number
  bio?: string | null
}

interface Profile {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  user_type?: 'student' | 'teacher' | 'parent' | 'admin'
  phone?: string | null
  is_premium?: boolean
  avatar_url?: string | null
  subscription_type?: string | null
  subscription_expires_at?: string | null
  student_profile?: StudentProfile
  teacher_profile?: TeacherProfile
  profile_completed?: boolean
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClientSideSupabase())
  const router = useRouter()

  const checkProfileCompletion = (profile: Profile): boolean => {
    if (profile.user_type === 'student' && profile.student_profile) {
      const sp = profile.student_profile
      return !!(sp.date_of_birth && sp.sex && sp.school_name && profile.avatar_url)
    }
    
    if (profile.user_type === 'teacher' && profile.teacher_profile) {
      const tp = profile.teacher_profile
      return !!(
        tp.date_of_birth && 
        tp.sex && 
        tp.school_name && 
        tp.teaching_subjects && 
        tp.teaching_subjects.length > 0 &&
        profile.avatar_url
      )
    }
    
    return true
  }

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      console.log('[Profile Fetch] Starting fetch for user:', userId)
      
      // ✅ Use maybeSingle() to avoid errors
      const { data: basicProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // ✅ Check for RLS recursion error specifically
      if (profileError) {
        if (profileError.code === '42P17') {
          console.error('🚨 [Profile Fetch] RLS RECURSION ERROR!')
          console.error('🔧 Fix: Update your RLS policies in Supabase')
          console.error('📋 See: https://supabase.com/docs/guides/auth/row-level-security')
        } else {
          console.error('[Profile Fetch] Database error:', profileError.message, profileError.code)
        }
        setProfile(null)
        return
      }

      if (!basicProfile) {
        console.log('[Profile Fetch] ⚠️ No profile found for user')
        setProfile(null)
        return
      }

      console.log('[Profile Fetch] ✅ Basic profile loaded:', basicProfile.user_type, basicProfile.email)

      // Fetch role-specific profile
      let roleProfile: Partial<Pick<Profile, 'student_profile' | 'teacher_profile'>> = {}
      
      if (basicProfile.user_type === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (studentError && studentError.code === '42P17') {
          console.error('🚨 [Profile Fetch] RLS RECURSION on student_profiles!')
        } else if (studentError) {
          console.log('[Profile Fetch] No student profile yet:', studentError.message)
        } else if (studentData) {
          roleProfile = { student_profile: studentData }
          console.log('[Profile Fetch] ✅ Student profile loaded')
        }
      } else if (basicProfile.user_type === 'teacher') {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (teacherError && teacherError.code === '42P17') {
          console.error('🚨 [Profile Fetch] RLS RECURSION on teacher_profiles!')
        } else if (teacherError) {
          console.log('[Profile Fetch] No teacher profile yet:', teacherError.message)
        } else if (teacherData) {
          roleProfile = { teacher_profile: teacherData }
          console.log('[Profile Fetch] ✅ Teacher profile loaded')
        }
      }

      const combinedProfile: Profile = {
        ...basicProfile,
        ...roleProfile,
        profile_completed: checkProfileCompletion({ ...basicProfile, ...roleProfile })
      }
      
      console.log('[Profile Fetch] ✅ Complete profile ready')
      setProfile(combinedProfile)

    } catch (error) {
      console.error('[Profile Fetch] Unexpected error:', error)
      setProfile(null)
    }
  }, [supabase])

  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      console.log('[Profile Refetch] Manually triggered')
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    let mounted = true
    let initComplete = false

    const initializeAuth = async () => {
      try {
        console.log('[Auth] 🚀 Initializing authentication...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Auth] Session error:', error.message)
          if (mounted) {
            setLoading(false)
            initComplete = true
          }
          return
        }

        if (!mounted) return

        if (session?.user) {
          console.log('[Auth] ✅ Session found:', session.user.email)
          setSession(session)
          setUser(session.user)
          
          // Fetch with retry
          const fetchWithRetry = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
              if (!mounted) return
              
              await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
              
              const { data: checkProfile, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session.user.id)
                .maybeSingle()
              
              // ✅ Check for RLS recursion
              if (checkError?.code === '42P17') {
                console.error('🚨 [Auth] RLS RECURSION DETECTED!')
                console.error('🔧 Please fix your RLS policies in Supabase')
                return
              }
              
              if (checkProfile) {
                console.log(`[Auth] Profile exists (attempt ${i + 1})`)
                await fetchProfile(session.user.id)
                return
              }
              
              console.log(`[Auth] Profile not ready yet (attempt ${i + 1}/${retries})`)
            }
            
            console.log('[Auth] ⚠️ Profile still not ready after retries')
          }
          
          await fetchWithRetry()
        } else {
          console.log('[Auth] ℹ️ No active session')
        }
        
        if (mounted) {
          setLoading(false)
          initComplete = true
        }

      } catch (error) {
        console.error('[Auth] Initialization error:', error)
        if (mounted) {
          setLoading(false)
          initComplete = true
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return
        
        console.log('[Auth] 🔄 State change:', event)
        
        if (!initComplete && event !== 'SIGNED_OUT') {
          console.log('[Auth] Skipping state change during initialization')
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            console.log('[Auth] User signed in/updated, fetching profile...')
            
            const delay = event === 'SIGNED_IN' ? 2000 : 500
            setTimeout(() => {
              if (mounted) fetchProfile(session.user.id)
            }, delay)
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed')
            if (!profile) {
              setTimeout(() => {
                if (mounted) fetchProfile(session.user.id)
              }, 300)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out')
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      console.log('[Auth] 🧹 Cleaning up')
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchProfile, profile])

  const signOut = async () => {
    try {
      console.log('[Auth] 👋 Signing out...')
      await supabase.auth.signOut()
      setProfile(null)
      setUser(null)
      setSession(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('[Auth] Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}