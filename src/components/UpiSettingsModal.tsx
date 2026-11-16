import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Loader2, CreditCard, User, QrCode } from 'lucide-react';
import { StudioSettings } from '../types.ts';

interface UpiSettingsModalProps {
  settings: StudioSettings | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: StudioSettings) => Promise<void>;
}

export const UpiSettingsModal: React.FC<UpiSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('DAVID MUSIC STUDIO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId || '');
      setPayeeName(settings.payeeName || 'DAVID MUSIC STUDIO');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() || !payeeName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        upiId: upiId.trim(),
        payeeName: payeeName.trim(),
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#16161A] border border-[#FF5500]/40 shadow-2xl p-6 sm:p-8 glow-ember overflow-hidden">
        {/* Background Flame Decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF5500]/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg bg-[#0D0D0F] border border-white/[0.08]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#FFB800] p-[1.5px]">
            <div className="w-full h-full bg-[#16161A] rounded-[9px] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#FF5500]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Studio UPI Settings</h2>
            <p className="text-xs text-zinc-400">Configure your payment receiving details.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-5">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Payee Name (displayed in UPI apps)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. DAVID MUSIC STUDIO"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FFB800] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Studio UPI ID
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. studio@upi"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono focus:outline-none focus:border-[#FF5500] transition-colors"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 italic ml-1">
              Clients will use this ID to settle their balance via GPay, PhonePe, etc.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFB800] text-black font-bold text-sm hover:opacity-95 disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,85,0,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save UPI Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
