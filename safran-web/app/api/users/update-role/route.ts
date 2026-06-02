import { createClient } from '@supabase/supabase-js' 
import { NextResponse } from 'next/server' 

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) 

export async function POST(request: Request) {
  const { user_id, role } = await request.json()
  console.log('Updating user_id:', user_id, 'role:', role)

  const { data: existingProfiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user_id)

  console.log('Profiles found with this user_id:', existingProfiles)

  // If no profile exists, create it
  if (!existingProfiles || existingProfiles.length === 0) {
    console.log('No profile found, creating one...')
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ user_id, nom: 'Unknown User', role: role || 'superviseur' })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
  } else {
    // Update existing profile
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('user_id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
