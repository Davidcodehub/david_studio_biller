import React from 'react';
import { Flame, Plus, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  adminEmail?: string | null;
  onOpenNewTrackModal?: () => void;
  onSignOut?: () => void;
  isClientView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  adminEmail,
  onOpenNewTrackModal,
  onSignOut,
  isClientView = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0D0D0F]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark with flame icon */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 select-none group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5500] to-[#FFB800] p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(255,85,0,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0D0D0F] rounded-[7px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF5500] fill-[#FF5500]/30 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-wider text-white whitespace-nowrap">
              DAVID MUSIC STUDIO
            </span>
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#FFB800]/80 -mt-1 hidden sm:block">
              Master Delivery & Vault
            </span>
          </div>
        </a>

        {/* Zone 2 & 3: Actions & Admin Status */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && onOpenNewTrackModal && (
            <button
              type="button"
              onClick={onOpenNewTrackModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FFB800] text-black hover:opacity-95 shadow-[0_0_16px_rgba(255,85,0,0.35)] transition-all transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Client Track</span>
            </button>
          )}

          {isAdmin && adminEmail && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16161A] border border-white/[0.08] text-xs font-mono text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[150px]">{adminEmail}</span>
            </div>
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161A] hover:bg-[#202026] text-zinc-400 hover:text-white border border-white/[0.08] text-xs font-medium transition-colors"
            >
              <span>Sign Out</span>
            </button>
          )}

          {isClientView && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#16161A] border border-[#FF5500]/30 text-xs font-mono text-[#FFB800]">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
              <span className="hidden sm:inline">Client Preview Vault</span>
              <span className="sm:hidden">Vault</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
