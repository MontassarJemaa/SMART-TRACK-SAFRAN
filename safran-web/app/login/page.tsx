'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/redux-hooks';
import { setAuthUser } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail } from 'lucide-react';
import type { Role } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, nom, role')
        .eq('user_id', user.id)
        .single();

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
        // Fallback
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
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#001F3F] to-[#003366]">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-[16px] shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="p-8 text-center">
              {/* Logo */}
              <Image
                src="/images/safran-smart-track-logo-fond-blanc.png"
                alt="Safran Smart Track"
                width={250}
                height={100}
                className="mx-auto mb-6"
                style={{ objectFit: 'contain' }}
              />
              <p className="text-slate-400 text-sm">
                Système de gestion des outillages par RFID
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-[#001F3F] outline-none transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-[#001F3F] outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#001F3F] text-white py-3 rounded-lg font-semibold hover:bg-[#002a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
          SAFRAN SEATS TUNISIE
        </p>
      </div>
    </div>
  );
}
