'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/redux-hooks';
import { setAuthUser, clearAuthUser, setAuthLoading } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/types';

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const supabase = createClient();

  useEffect(() => {
    async function initAuth() {
      dispatch(setAuthLoading(true));
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let profile;
        try {
          // Fetch profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, nom, role')
            .eq('user_id', user.id)
            .single();
          profile = profileData;
        } catch (err) {
          profile = null;
        }

        if (profile) {
          dispatch(
            setAuthUser({
              userId: profile.user_id,
              email: user.email || '',
              role: profile.role as Role,
              displayName: profile.nom
            })
          );
        } else {
          // Fallback if no profile exists or error
          const fallbackNom =
            user.email?.split('@')[0] || 'Utilisateur';
          dispatch(
            setAuthUser({
              userId: user.id,
              email: user.email || '',
              role: 'superviseur',
              displayName: fallbackNom
            })
          );
        }
      } else {
        // Clear auth state if there's no user
        dispatch(clearAuthUser());
      }
      dispatch(setAuthLoading(false));
    }

    void initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        dispatch(setAuthLoading(true));
        if (session?.user) {
          let profile;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('user_id, nom, role')
              .eq('user_id', session.user.id)
              .single();
            profile = profileData;
          } catch (err) {
            profile = null;
          }
          
          if (profile) {
            dispatch(
              setAuthUser({
                userId: profile.user_id,
                email: session.user.email || '',
                role: profile.role as Role,
                displayName: profile.nom
              })
            );
          } else {
            const fallbackNom =
              session.user.email?.split('@')[0] || 'Utilisateur';
            dispatch(
              setAuthUser({
                userId: session.user.id,
                email: session.user.email || '',
                role: 'superviseur',
                displayName: fallbackNom
              })
            );
          }
        } else {
          dispatch(clearAuthUser());
        }
        dispatch(setAuthLoading(false));
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
