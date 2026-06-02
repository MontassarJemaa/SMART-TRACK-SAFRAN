'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/lib/redux-hooks';
import { setSiteFilter } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useSettings from '@/lib/useSettings';
import { getRoleColor, getRoleLabel, getRoleDotColor, getInitials, Role } from '@/lib/utils';

const SITE_OPTIONS = ['Tous', 'CST 1', 'CST 2', 'T6', 'TTR'];

type Profile = {
  user_id: string;
  nom: string;
  role: Role;
};

type UserWithEmail = Profile & {
  email: string;
};

export default function ReglagesPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const dispatch = useAppDispatch();
  const [toastMessage, setToastMessage] = useState('');
  const [supabaseOnline, setSupabaseOnline] = useState<boolean | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // Add User Form State
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<Role>('superviseur');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null);
  const [modalRole, setModalRole] = useState<Role>('magasin');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Computed nom from email
  const detectedNom = useMemo(() => {
    if (!addEmail) return '';
    const localPart = addEmail.split('@')[0];
    return localPart.split('.').map((p: string) => 
      p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    ).join(' ');
  }, [addEmail]);
  
  // Function to fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list', { cache: 'no-store' });
      const data = await response.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      if (!isSupabaseConfigured) {
        setSupabaseOnline(false);
        setLoading(false);
        return;
      }
      
      try {
        // Check Supabase connection
        const { error: outillagesError } = await supabase
          .from('outillages')
          .select('id')
          .limit(1);
        setSupabaseOnline(!outillagesError);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }
        
        setCurrentEmail(user.email || '');
        
        // Fetch current user's profile
        const { data: currentProfileData } = await supabase.from('profiles').select('user_id, nom, role').eq('user_id', user.id).single();
        
        if (currentProfileData) {
          setCurrentProfile(currentProfileData as Profile);
        } else {
          // Fallback if no profile exists
          setCurrentProfile({
            user_id: user.id,
            nom: user.email?.split('@')[0] || 'Utilisateur',
            role: 'superviseur'
          });
        }
        
        // If admin, fetch all users from API
        if (currentProfileData?.role === 'admin') {
          await fetchUsers();
        }
        
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setSupabaseOnline(false);
      } finally {
        setLoading(false);
      }
    }
    
    void init();
  }, []);

  const currentInitials = useMemo(() => {
    if (!currentProfile) return 'SS';
    return getInitials(currentProfile.nom);
  }, [currentProfile]);
  
  const groupedUsers = useMemo(() => {
    const groups: Record<string, UserWithEmail[]> = {};
    allUsers.forEach(user => {
      if (!groups[user.role]) {
        groups[user.role] = [];
      }
      groups[user.role].push(user);
    });
    return groups;
  }, [allUsers]);
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    
    // Validate email ends with @safrangroup.com
    if (!addEmail.endsWith('@safrangroup.com')) {
      setAddError('L\'email doit se terminer par @safrangroup.com');
      setAddLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          role: addRole
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      
      // Success!
      setAddSuccess('Utilisateur ajouté avec succès !');
      
      // Reset form
      setAddEmail('');
      setAddPassword('');
      setAddRole('superviseur');
      
      // Refresh user list
      await fetchUsers();
      
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };
  
  const handleOpenModal = (user: UserWithEmail) => {
    setSelectedUser(user);
    setModalRole(user.role);
    setModalError(null);
    setShowDeleteConfirm(false);
  };
  
  const handleCloseModal = () => {
    setSelectedUser(null);
    setModalError(null);
    setShowDeleteConfirm(false);
  };
  
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    setModalError(null);
    
    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          role: modalRole
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      
      // Refresh user list
      await fetchUsers();
      
      handleCloseModal();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setModalLoading(true);
    setModalError(null);
    
    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.user_id })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      
      // Refresh user list
      await fetchUsers();
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Delete error:', err);
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="page-shell p-6 lg:p-8">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-safran-success px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader title="Réglages" subtitle="Configuration du dashboard et gestion des utilisateurs" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mon Profil Section */}
        <Card className="!p-6">
          <h2 className="text-lg font-semibold text-[#001F3F] mb-6">Mon Profil</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ) : (
            <div className="flex items-start gap-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${
                getRoleColor(currentProfile?.role || 'magasin')
              }`}>
                {currentInitials}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[#001F3F]">
                  {currentProfile?.nom || 'Utilisateur'}
                </h3>
                <p className="text-slate-500 mt-1">{currentEmail}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                    getRoleColor(currentProfile?.role || 'magasin')
                  }`}>
                    {getRoleLabel(currentProfile?.role || 'magasin')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
        
        {/* Ajouter un utilisateur (Admin Only) */}
        {currentProfile?.role === 'admin' && (
          <Card className="!p-6">
            <h2 className="text-lg font-semibold text-[#001F3F] mb-6">Ajouter un utilisateur</h2>
            
            {addSuccess && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <span>✅</span>
                <span>{addSuccess}</span>
              </div>
            )}
            
            {addError && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <span>❌</span>
                <span>{addError}</span>
              </div>
            )}
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email (@safrangroup.com)</label>
                <Input 
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                  placeholder="Ex: jean.dupont@safrangroup.com"
                />
                {detectedNom && (
                  <p className="text-sm text-slate-500 mt-2">
                    Nom détecté : {detectedNom}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <Input 
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                  placeholder="Mot de passe sécurisé"
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rôle</label>
                <select 
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-[#001F3F] outline-none transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="superviseur">Superviseur</option>
                  <option value="magasin">Magasin</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-3 px-4 bg-[#001F3F] text-white font-semibold rounded-lg hover:bg-[#002a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </Card>
        )}
        
        {/* Gestion des utilisateurs (Admin Only) */}
        {currentProfile?.role === 'admin' && (
          <Card className="!p-6">
            <h2 className="text-lg font-semibold text-[#001F3F] mb-6">Gestion des utilisateurs</h2>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {['admin', 'superviseur', 'maintenance', 'magasin'].map(role => {
                  const usersInRole = groupedUsers[role];
                  if (!usersInRole?.length) return null;
                  return (
                    <div key={role}>
                      <h3 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          getRoleDotColor(role)
                        }`} />
                        {getRoleLabel(role)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {usersInRole.map(user => (
                          <div 
                            key={user.user_id} 
                            onClick={() => handleOpenModal(user)}
                            className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                            style={{ minWidth: "280px" }}
                          >
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shrink-0 ${
                              getRoleColor(user.role)
                            }`}>
                              {getInitials(user.nom)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-800">{user.nom}</p>
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${
                                  getRoleColor(user.role)
                                }`}>
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: "100%" }}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
        
        {/* Existing Cards */}
        <Card className="!p-4">
          <h2 className="mb-0 text-lg font-semibold text-safran-navy">Préférences d'affichage</h2>

          <div className="mt-4">
            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Langue</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateSetting('langue', 'fr')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    settings.langue === 'fr' ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => showToast('Bientôt disponible')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    settings.langue === 'en' ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Format de date</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formatDate"
                    checked={settings.formatDate === 'dd/mm/yyyy'}
                    onChange={() => updateSetting('formatDate', 'dd/mm/yyyy')}
                  />
                  <span className="text-sm">JJ/MM/AAAA</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formatDate"
                    checked={settings.formatDate === 'yyyy-mm-dd'}
                    onChange={() => updateSetting('formatDate', 'yyyy-mm-dd')}
                  />
                  <span className="text-sm">AAAA-MM-JJ</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nombre de lignes par tableau</label>
              <div className="flex flex-wrap gap-2">
                {[10, 100, 1000].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateSetting('nbLignesTableau', n as any)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      settings.nbLignesTableau === n ? 'bg-safran-blue text-white' : 'border border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button
                onClick={() => {
                  resetSettings();
                  showToast('Préférences réinitialisées');
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Réinitialiser les préférences
              </button>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <h2 className="mb-2 text-lg font-semibold text-safran-navy">À propos</h2>
          <p className="text-sm text-gray-600">SAFRAN SMART TRACK — Dashboard web</p>
          <p className="mt-1 text-sm text-gray-600">Version 1.0.0 · Next.js 14 · Supabase</p>
          <p className="mt-1 text-sm text-gray-600">Designed by Montassar Jemaa</p>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
              <span className={`h-2 w-2 rounded-full bg-green-500 animate-pulse`} />
              {supabaseOnline ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>
        </Card>
      </div>
      
      {/* User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#001F3F]">Détails de l'utilisateur</h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white mb-3 ${
                getRoleColor(selectedUser.role)
              }`}>
                {getInitials(selectedUser.nom)}
              </div>
              <h3 className="text-xl font-semibold text-slate-800">{selectedUser.nom}</h3>
              <p className="text-slate-500">{selectedUser.email}</p>
            </div>
            
            {modalError && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <span>❌</span>
                <span>{modalError}</span>
              </div>
            )}
            
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-slate-700 text-center">Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={modalLoading}
                    className="flex-1 py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rôle</label>
                  <select 
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value as any)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-[#001F3F] outline-none transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="superviseur">Superviseur</option>
                    <option value="magasin">Magasin</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleCloseModal}
                    className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleUpdateRole}
                    disabled={modalLoading}
                    className="flex-1 py-2 px-4 bg-[#001F3F] text-white font-semibold rounded-lg hover:bg-[#002a52] transition-colors disabled:opacity-50"
                  >
                    Enregistrer
                  </button>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={modalLoading}
                    className="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
