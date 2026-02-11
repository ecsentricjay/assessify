import { signOut } from '@/lib/actions/auth.actions'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  await signOut()
}