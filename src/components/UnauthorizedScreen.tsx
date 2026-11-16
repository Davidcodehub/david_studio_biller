import React from 'react';
import { ShieldAlert, LogOut, Flame } from 'lucide-react';
import { auth, ADMIN_EMAIL } from '../firebase/config.ts';

interface UnauthorizedScreenProps {
  userEmail: string | null;
  onSignOut: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
  userEmail,
  onSignOut,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="relative w-full max-w-md rounded-2xl bg-[#16161A] border-2 border-red-500/40 shadow-2xl p-8 sm:p-10 text-center space-y-6 glow-ember">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] uppercase font-mono tracking-widest text-red-400 font-bold">
            Access Denied
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            Unauthorized Access
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            You are signed in as <strong className="text-zinc-200 font-mono">{userEmail || 'unknown'}</strong>.
            This Studio Admin Dashboard is strictly restricted to the authorized studio owner:
          </p>
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-[#0D0D0F] border border-white/[0.08] text-xs font-mono text-[#FFB800] inline-block font-semibold">
            {ADMIN_EMAIL}
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs sm:text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
