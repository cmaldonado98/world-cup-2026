'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

// Appended internally so the stored password meets Supabase's default min-length (6).
// The user only sees/types 4 digits. Configure Auth > Password min length = 4 in
// Supabase dashboard to remove the need for this suffix.
const PIN_SUFFIX = 'Pnni26!';

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const [mode,    setMode]    = useState<Mode>('login');
  const [email,   setEmail]   = useState('');
  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [info,    setInfo]    = useState('');

  const pinInputRef = useRef<HTMLInputElement>(null);

  const resetState = (newMode: Mode) => {
    setMode(newMode);
    setPin('');
    setError('');
    setInfo('');
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');
    // Auto-submit the moment the 4th digit is entered
    if (digits.length === 4) submit(digits);
  };

  const submit = useCallback(async (pinOverride?: string) => {
    const currentPin = pinOverride ?? pin;
    if (!email.trim() || currentPin.length < 4) return;

    setLoading(true);
    setError('');
    setInfo('');
    pinInputRef.current?.blur();

    const password = currentPin + PIN_SUFFIX;
    const supabase = getSupabaseClient();

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        const msg = err.message.includes('Invalid login credentials')
          ? 'Email o PIN incorrecto'
          : err.message;
        setError(msg);
        setPin('');
        pinInputRef.current?.focus();
      }
      // On success AlbumContext picks up the session change automatically
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        setPin('');
        pinInputRef.current?.focus();
      } else {
        setInfo('Cuenta creada. Revisa tu correo para verificar la cuenta.');
        setPin('');
      }
    }

    setLoading(false);
  }, [email, pin, mode]);

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black flex flex-col items-center justify-center px-6 py-12 gap-6">
      {/* Branding */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl">⚽</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Álbum 2026</h1>
        <p className="text-sm text-ios-gray">FIFA World Cup</p>
      </div>

      {/* Segmented mode switcher */}
      <div className="flex bg-ios-gray5 dark:bg-[#2C2C2E] rounded-xl p-1 w-full max-w-sm">
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => resetState(m)}
            className={[
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all tap-scale',
              mode === m ? 'segmented-active text-gray-900' : 'text-ios-gray',
            ].join(' ')}
          >
            {m === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Email field */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-card overflow-hidden">
          <label className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={18} className="text-ios-gray flex-shrink-0" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="flex-1 bg-transparent text-[16px] text-gray-900 dark:text-white
                         placeholder:text-ios-gray4 outline-none"
            />
          </label>
        </div>

        {/* PIN entry */}
        <div
          className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-card px-5 py-5
                     flex flex-col items-center gap-4 cursor-text"
          onClick={() => pinInputRef.current?.focus()}
        >
          <p className="text-[11px] font-semibold text-ios-gray uppercase tracking-widest">
            PIN de 4 dígitos
          </p>

          {/* Dot indicators */}
          <div className="flex items-center gap-5">
            {[0, 1, 2, 3].map(i => {
              const filled = pin.length > i;
              return (
                <div
                  key={i}
                  className={[
                    'rounded-full transition-all duration-150',
                    filled
                      ? 'w-4 h-4 bg-ios-blue scale-110'
                      : 'w-3.5 h-3.5 border-2 border-ios-gray3 dark:border-ios-gray',
                  ].join(' ')}
                />
              );
            })}
          </div>

          {/* The actual input – covers the whole area so any tap on the card opens keyboard */}
          <input
            ref={pinInputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="current-password"
            maxLength={4}
            value={pin}
            onChange={handlePinChange}
            // Invisible but accessible and focusable
            className="absolute opacity-0 w-px h-px pointer-events-none text-[16px]"
            tabIndex={0}
            aria-label="PIN de 4 dígitos"
          />
        </div>

        {/* Feedback messages */}
        {error && <p className="text-xs text-[#FF3B30] text-center">{error}</p>}
        {info  && <p className="text-xs text-[#34C759] text-center">{info}</p>}

        {/* Submit button – also acts as manual trigger */}
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading || !email.trim() || pin.length < 4}
          className="w-full py-3.5 rounded-2xl bg-ios-blue text-white font-semibold text-sm
                     disabled:opacity-40 flex items-center justify-center gap-2 tap-scale"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  );
}
