import { createClient } from '@supabase/supabase-js' 
import { NextResponse } from 'next/server' 

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) 

export async function POST(request: Request) {
  const { email, password, role } = await request.json()
  console.log('Creating user with email:', email, 'role:', role)

  // Validate email domain (double-check for safety)
  if (!email.endsWith('@safrangroup.com')) {
    return NextResponse.json({ error: "L'email doit être du domaine @safrangroup.com" }, { status: 400 })
  }

  const localPart = email.split('@')[0]
  const nom = localPart.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')

  const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: nom }
  })

  if (authError) {
    console.error('Auth error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  console.log('Created auth user:', user?.user?.id)

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({ user_id: user.user.id, nom, role }, { onConflict: 'user_id' })

  if (profileError) {
    console.error('Profile error:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  console.log('Created profile for user_id:', user?.user?.id)
  return NextResponse.json({ success: true })
}
