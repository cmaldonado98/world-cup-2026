'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAlbum } from '@/contexts/AlbumContext';
import type { CardMap } from '@/contexts/AlbumContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, LogOut, Mail, Calendar, Download, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user, cardMap, importCards } = useAlbum();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const payload = JSON.stringify({ version: 1, cardMap }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-album-2026.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          typeof parsed.cardMap !== 'object' ||
          parsed.cardMap === null ||
          Array.isArray(parsed.cardMap)
        ) {
          alert('El archivo no tiene un formato válido.');
          return;
        }
        // Sanitize: only keep string keys with positive integer values
        const clean: CardMap = {};
        for (const [k, v] of Object.entries(parsed.cardMap)) {
          if (typeof k === 'string' && typeof v === 'number' && Number.isInteger(v) && v > 0) {
            clean[k] = v;
          }
        }
        importCards(clean);
        alert(`Importación exitosa. ${Object.keys(clean).length} cromos cargados.`);
      } catch {
        alert('No se pudo leer el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be imported again if needed
    e.target.value = '';
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
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

      {/* Data Backup */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-card overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-ios-gray uppercase tracking-wide">Respaldo de datos</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-3 w-full px-5 py-4 text-gray-800 dark:text-gray-200 tap-scale border-b border-gray-100 dark:border-white/5"
        >
          <Download size={18} className="text-ios-blue" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Exportar a JSON</p>
            <p className="text-xs text-ios-gray">Descarga un archivo de respaldo</p>
          </div>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 w-full px-5 py-4 text-gray-800 dark:text-gray-200 tap-scale"
        >
          <Upload size={18} className="text-ios-blue" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Importar desde JSON</p>
            <p className="text-xs text-ios-gray">Restaura un respaldo anterior</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-4 text-[#FF3B30] font-semibold bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-card tap-scale"
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>
    </div>
  );
}
