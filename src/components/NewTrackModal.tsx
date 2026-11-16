import React, { useState } from 'react';
import { X, UploadCloud, FileAudio, Check, Flame, Link2, Sparkles, Loader2 } from 'lucide-react';
import { ClientProject, PaymentStatus } from '../types.ts';
import { uploadAudioToStorage } from '../firebase/firestore.ts';

interface NewTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<ClientProject, 'id'>) => Promise<void>;
}

export const NewTrackModal: React.FC<NewTrackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [clientName, setClientName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(20000);
  const [advancePaid, setAdvancePaid] = useState<number>(5000);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending UPI');
  const [genre, setGenre] = useState('Bollywood / Pop');
  const [tempoBpm, setTempoBpm] = useState<number>(120);

  // Preview MP3 Mode & Inputs
  const [previewMode, setPreviewMode] = useState<'upload' | 'url'>('url');
  const [previewUrl, setPreviewUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUploadProgress, setPreviewUploadProgress] = useState<number | null>(null);

  // Master WAV Mode & Inputs
  const [masterMode, setMasterMode] = useState<'upload' | 'url'>('url');
  const [masterUrl, setMasterUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [masterUploadProgress, setMasterUploadProgress] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto calculate balance due & isPaid
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

  const handlePreviewFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPreviewFile(e.target.files[0]);
    }
  };

  const handleMasterFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMasterFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !songTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let finalPreviewUrl = previewUrl.trim();
      let previewFileName = previewFile ? previewFile.name : 'Watermarked_Preview_128k.mp3';

      // Handle Preview File upload to Firebase Storage if selected
      if (previewMode === 'upload' && previewFile) {
        setPreviewUploadProgress(10);
        finalPreviewUrl = await uploadAudioToStorage(
          previewFile,
          'previews',
          (prog) => setPreviewUploadProgress(prog)
        );
        previewFileName = previewFile.name;
      }

      let finalMasterUrl = masterUrl.trim();
      let masterFileName = masterFile ? masterFile.name : `${songTitle.trim().replace(/\s+/g, '_')}_Master_24bit.wav`;
      let masterFileSize = masterFile ? `${(masterFile.size / (1024 * 1024)).toFixed(1)} MB` : '82.4 MB';

      // Handle Master WAV upload to Firebase Storage if selected
      if (masterMode === 'upload' && masterFile) {
        setMasterUploadProgress(10);
        finalMasterUrl = await uploadAudioToStorage(
          masterFile,
          'masters',
          (prog) => setMasterUploadProgress(prog)
        );
        masterFileName = masterFile.name;
        masterFileSize = `${(masterFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const newTrack: Omit<ClientProject, 'id'> = {
        clientName: clientName.trim(),
        songTitle: songTitle.trim(),
        totalAmount: Number(totalAmount) || 0,
        advancePaid: paymentStatus === 'Paid in Full - Cash' ? Number(totalAmount) : Number(advancePaid) || 0,
        balanceDue,
        isPaid,
        paymentStatus,
        genre: genre.trim() || 'Audio Production',
        tempoBpm: Number(tempoBpm) || 120,
        audioPreviewUrl: finalPreviewUrl,
        masterWavUrl: finalMasterUrl,
        previewFileName,
        masterWavFileName: masterFileName,
        masterWavFileSize: masterFileSize,
        sampleRate: '96.0 kHz / 24-bit Lossless Broadcast WAV',
        lufsIntegrated: '-14.0 LUFS',
        truePeak: '-0.3 dBTP',
        createdAt: new Date().toISOString(),
        paymentNotified: false,
      };

      await onSubmit(newTrack);
      onClose();
    } catch (err: unknown) {
      console.error('Error creating track:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create track in Firestore.');
    } finally {
      setIsSubmitting(false);
      setPreviewUploadProgress(null);
      setMasterUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#16161A] border border-[#FF5500]/40 shadow-2xl p-6 sm:p-8 glow-ember max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg bg-[#0D0D0F] border border-white/[0.08] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5500] to-[#FFB800] p-[1px] flex items-center justify-center shadow-[0_0_12px_rgba(255,85,0,0.35)]">
            <div className="w-full h-full bg-[#16161A] rounded-[7px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF5500]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">New Client Track</h2>
            <p className="text-xs text-zinc-400">
              Create and persist a client mastering project to Cloud Firestore and Firebase Storage.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 mb-5">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client Name & Song Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Client Name <span className="text-[#FF5500]">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Aryan Malhotra"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Song Title <span className="text-[#FF5500]">*</span>
              </label>
              <input
                type="text"
                required
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g. O Re Piya (Acoustic Master)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition-colors"
              />
            </div>
          </div>

          {/* Genre & BPM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Genre / Style
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Sufi Rock, Hip Hop, Pop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FF5500]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tempo (BPM)
              </label>
              <input
                type="number"
                min={40}
                max={250}
                value={tempoBpm}
                onChange={(e) => setTempoBpm(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>

          {/* Pricing Row: Total Fee & Advance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Total Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Advance Paid (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={totalAmount}
                  step={500}
                  required
                  disabled={paymentStatus === 'Paid in Full - Cash'}
                  value={paymentStatus === 'Paid in Full - Cash' ? totalAmount : advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#FF5500] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Payment Status Initial State */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Payment Status Initial State
            </label>
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

          {/* Balance Due Live Preview */}
          <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Auto-Calculated Balance Due:</span>
            <span
              className={`text-base font-mono font-bold tabular-nums ${
                balanceDue > 0 ? 'text-[#FF5500]' : 'text-emerald-400'
              }`}
            >
              ₹{balanceDue.toLocaleString('en-IN')}{' '}
              {balanceDue === 0 ? '(Master Unlocked)' : '(Master Locked)'}
            </span>
          </div>

          {/* Audio Section: Watermarked MP3 Preview */}
          <div className="p-4 rounded-xl bg-[#0D0D0F] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <FileAudio className="w-4 h-4 text-[#FF5500]" />
                <span>1. Watermarked MP3 Preview (128kbps)</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#16161A] border border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewMode('upload')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    previewMode === 'upload' ? 'bg-[#FF5500] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('url')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    previewMode === 'url' ? 'bg-[#FF5500] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {previewMode === 'upload' ? (
              <div>
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-700 hover:border-[#FF5500] rounded-xl cursor-pointer bg-[#16161A]/50 transition-colors">
                  <UploadCloud className="w-6 h-6 text-[#FF5500] mb-1.5" />
                  <span className="text-xs text-zinc-300 font-medium">
                    {previewFile ? previewFile.name : 'Select MP3 Preview File to Upload'}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    Will upload directly to Firebase Storage
                  </span>
                  <input
                    type="file"
                    accept="audio/mp3,audio/*"
                    onChange={handlePreviewFileSelected}
                    className="hidden"
                  />
                </label>
                {previewUploadProgress !== null && (
                  <div className="mt-2 text-xs text-[#FF5500] font-mono">
                    Uploading preview to Storage: {previewUploadProgress}%
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="Paste direct MP3 audio URL (e.g. https://...)"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#16161A] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] font-mono"
                />
              </div>
            )}
          </div>

          {/* Audio Section: Master 24-Bit WAV */}
          <div className="p-4 rounded-xl bg-[#0D0D0F] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <FileAudio className="w-4 h-4 text-[#FFB800]" />
                <span>2. Master 24-Bit WAV (Lossless Broadcast)</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#16161A] border border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => setMasterMode('upload')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    masterMode === 'upload' ? 'bg-[#FFB800] text-black font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setMasterMode('url')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    masterMode === 'url' ? 'bg-[#FFB800] text-black font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {masterMode === 'upload' ? (
              <div>
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-700 hover:border-[#FFB800] rounded-xl cursor-pointer bg-[#16161A]/50 transition-colors">
                  <UploadCloud className="w-6 h-6 text-[#FFB800] mb-1.5" />
                  <span className="text-xs text-zinc-300 font-medium">
                    {masterFile ? masterFile.name : 'Select 24-Bit WAV Master File to Upload'}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    Will upload to Firebase Storage & stay locked until balance is ₹0
                  </span>
                  <input
                    type="file"
                    accept="audio/wav,audio/*"
                    onChange={handleMasterFileSelected}
                    className="hidden"
                  />
                </label>
                {masterUploadProgress !== null && (
                  <div className="mt-2 text-xs text-[#FFB800] font-mono">
                    Uploading Master WAV to Storage: {masterUploadProgress}%
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={masterUrl}
                  onChange={(e) => setMasterUrl(e.target.value)}
                  placeholder="Paste direct Master WAV download URL (e.g. https://...)"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#16161A] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFB800] font-mono"
                />
              </div>
            )}
            <p className="text-[11px] text-zinc-500 italic">
              Security Guarantee: This URL is stored securely in Firestore and will NOT be served to the client portal until isPaid is confirmed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FFB800] text-black font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(255,85,0,0.35)] hover:shadow-[0_0_20px_rgba(255,85,0,0.5)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <span>Save Client Track</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
