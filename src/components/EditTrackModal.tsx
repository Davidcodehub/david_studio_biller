import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Loader2 } from 'lucide-react';
import { ClientProject, PaymentStatus } from '../types.ts';

interface EditTrackModalProps {
  project: ClientProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, updates: Partial<ClientProject>) => Promise<void>;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  project,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [clientName, setClientName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending UPI');
  const [genre, setGenre] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [masterWavUrl, setMasterWavUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setClientName(project.clientName || '');
      setSongTitle(project.songTitle || '');
      setTotalAmount(project.totalAmount || 0);
      setAdvancePaid(project.advancePaid || 0);
      setPaymentStatus(project.paymentStatus || 'Pending UPI');
      setGenre(project.genre || '');
      setAudioPreviewUrl(project.audioPreviewUrl || '');
      setMasterWavUrl(project.masterWavUrl || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const balanceDue =
    paymentStatus === 'Paid in Full - Cash'
      ? 0
      : Math.max(0, totalAmount - (advancePaid || 0));

  const isPaid = balanceDue === 0;

  const handleStatusToggle = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'Paid in Full - Cash') {
      setAdvancePaid(totalAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !songTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit(project.id, {
        clientName: clientName.trim(),
        songTitle: songTitle.trim(),
        totalAmount: Number(totalAmount) || 0,
        advancePaid: paymentStatus === 'Paid in Full - Cash' ? Number(totalAmount) : Number(advancePaid) || 0,
        balanceDue,
        isPaid,
        paymentStatus,
        genre: genre.trim(),
        audioPreviewUrl: audioPreviewUrl.trim(),
        masterWavUrl: masterWavUrl.trim(),
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update track in Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#16161A] border border-[#FF5500]/40 shadow-2xl p-6 sm:p-8 glow-ember max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg bg-[#0D0D0F] border border-white/[0.08]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5500] to-[#FFB800] p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#16161A] rounded-[7px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF5500]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Edit Client Track</h2>
            <p className="text-xs text-zinc-400">Update track metadata and settlement details in Firestore.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-5">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Client Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Song Title</label>
              <input
                type="text"
                required
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Total Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Advance Paid (₹)</label>
              <input
                type="number"
                min={0}
                max={totalAmount}
                value={paymentStatus === 'Paid in Full - Cash' ? totalAmount : advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                disabled={paymentStatus === 'Paid in Full - Cash'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#FF5500] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Payment Status</label>
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-[#0D0D0F] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleStatusToggle('Pending UPI')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  paymentStatus === 'Pending UPI'
                    ? 'bg-[#FF5500] text-white shadow-[0_0_12px_rgba(255,85,0,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Pending UPI</span>
                {paymentStatus === 'Pending UPI' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleStatusToggle('Paid in Full - Cash')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  paymentStatus === 'Paid in Full - Cash'
                    ? 'bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Paid in Full - Cash</span>
                {paymentStatus === 'Paid in Full - Cash' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Balance Due:</span>
            <span className={`font-mono font-bold ${balanceDue > 0 ? 'text-[#FF5500]' : 'text-emerald-400'}`}>
              ₹{balanceDue.toLocaleString('en-IN')} {balanceDue === 0 ? '(Master Unlocked)' : '(Master Locked)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Watermarked Preview MP3 URL</label>
            <input
              type="url"
              value={audioPreviewUrl}
              onChange={(e) => setAudioPreviewUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-xs text-white font-mono focus:outline-none focus:border-[#FF5500]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Master 24-Bit WAV URL</label>
            <input
              type="url"
              value={masterWavUrl}
              onChange={(e) => setMasterWavUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-xs text-white font-mono focus:outline-none focus:border-[#FFB800]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFB800] text-black font-bold text-xs sm:text-sm hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
