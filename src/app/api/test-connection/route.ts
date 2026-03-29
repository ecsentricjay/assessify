import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test query
    const { data, error } = await supabase
      .from('institutions')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        status: 'error',
        message: error.message,
        details: error 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Connected to Supabase',
      env_check: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: error.message 
    }, { status: 500 })
  }
}