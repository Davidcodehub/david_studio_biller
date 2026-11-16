import React, { useState } from 'react';
import { Flame, ShieldCheck, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from '../firebase/config.ts';

interface AdminLoginProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onShowToast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      onShowToast(`Signed in as ${result.user.email}`, 'success');
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(message);
      onShowToast(message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative w-full max-w-md">
        {/* Glowing fire aura backdrop */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#FFB800]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-2xl bg-[#16161A] border border-white/[0.08] shadow-2xl p-8 sm:p-10 glow-ember">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5500] to-[#FFB800] p-[1.5px] shadow-[0_0_25px_rgba(255,85,0,0.45)]">
              <div className="w-full h-full bg-[#0D0D0F] rounded-[14px] flex items-center justify-center">
                <Flame className="w-7 h-7 text-[#FF5500] fill-[#FF5500]/30 animate-pulse" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#FFB800] font-bold">
                Audio Mastering & Release
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                DAVID MUSIC STUDIO
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                Studio Admin Authentication & Master Vault Control
              </p>
            </div>
          </div>

          {/* Security notice */}
          <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.06] mb-6 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 leading-relaxed">
              Restricted console. Management access is strictly authorized for{' '}
              <strong className="text-zinc-200 font-mono">{ADMIN_EMAIL}</strong>.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In with Google Button */}
          <div className="space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign in with Google'}</span>
            </button>

            <div className="text-center text-[11px] text-zinc-500">
              Clients access tracks via direct shareable link (<code className="text-zinc-400 font-mono">/track/:id</code>) without login.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
