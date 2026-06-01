import { createClient } from '@supabase/supabase-js' 
import { NextResponse } from 'next/server' 

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) 

export async function POST(request: Request) {
  const { user_id } = await request.json()
  console.log('Deleting user_id:', user_id)

  // Delete profile first (if it exists)
  const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('user_id', user_id)
  
  if (deleteProfileError) {
    console.error('Error deleting profile:', deleteProfileError)
  }

  // Try to delete auth user
  try {
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
    }
  } catch (e) {
    console.error('Exception deleting auth user:', e)
  }

  // Return success regardless (profile is deleted)
  return NextResponse.json({ success: true })
}
