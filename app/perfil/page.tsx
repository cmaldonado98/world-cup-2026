'use client';

import { useRouter } from 'next/navigation';
import { useAlbum } from '@/contexts/AlbumContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, LogOut, Mail, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAlbum();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    // After logging out, AppShell should automatically pick up the missing session!
    // But we can also push to home to be safe
    router.push('/');
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black p-4 pt-14 pb-24 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
        <p className="text-sm text-ios-gray">Tus datos y ajustes</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-ios-card relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-ios-blue/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 mb-6">
          <div className="w-16 h-16 rounded-full bg-ios-blue/10 text-ios-blue flex items-center justify-center flex-shrink-0">
            <User size={32} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.email}
            </p>
            <p className="text-xs text-ios-gray">Sesión Activa</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Mail size={16} className="text-ios-gray" />
            <span className="truncate">{user?.email}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Calendar size={16} className="text-ios-gray" />
              <span>Miembro desde el {formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-4 text-[#FF3B30] font-semibold bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-card tap-scale"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
