import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, nom, role');

    console.log('Profiles found:', profiles);
    console.log('Auth users data:', authUsersData);
    
    // Correctly get users from auth
    const usersList = authUsersData?.users || [];
    console.log('Auth users list length:', usersList.length);

    const users = profiles?.map(profile => {
      const authUser = usersList.find(u => u.id === profile.user_id);
      return {
        user_id: profile.user_id,
        nom: profile.nom,
        role: profile.role,
        email: authUser?.email || ''
      };
    }) || [];

    console.log('Returning users:', users);
    return NextResponse.json({ users: users });
  } catch (error: any) {
    console.error('Error in /api/users/list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
