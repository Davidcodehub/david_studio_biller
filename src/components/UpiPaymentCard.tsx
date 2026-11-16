import React, { useState } from 'react';
import { Lock, Copy, Check, AlertTriangle, Send, Sparkles, Smartphone, CreditCard, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClientProject, StudioSettings } from '../types.ts';
import { submitPaymentNotification } from '../firebase/firestore.ts';

interface UpiPaymentCardProps {
  project: ClientProject;
  settings: StudioSettings;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const UpiPaymentCard: React.FC<UpiPaymentCardProps> = ({
  project,
  settings,
  onShowToast,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNote, setUtrNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studioUpiId = settings.upiId || 'davidmusicstudio@upi';
  const studioPayeeName = settings.payeeName || 'DAVID MUSIC STUDIO';

  // Construct NPCI UPI Deep Link
  // Format: upi://pay?pa=<VPA>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
  const upiDeepLink = `upi://pay?pa=${studioUpiId}&pn=${encodeURIComponent(studioPayeeName)}&am=${project.balanceDue}&cu=INR&tn=${encodeURIComponent(project.songTitle.slice(0, 50))}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(studioUpiId).then(() => {
      setCopiedUpi(true);
      onShowToast(`UPI ID copied: ${studioUpiId}`, 'success');
      setTimeout(() => setCopiedUpi(false), 2500);
    });
  };

  const handleSubmitVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitPaymentNotification(project.id, utrNote);
      onShowToast('Payment verification request submitted!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to submit verification.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPendingVerification = project.paymentStatus === 'verification_pending';

  return (
    <div className="relative rounded-2xl bg-[#16161A] border-2 border-[#FF5500]/60 p-6 sm:p-8 shadow-2xl glow-ember transition-all duration-300">
      {/* Locked Status Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-[#FF5500] font-semibold">
                Locked Master Access
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FF5500]/15 text-[#FF8800] border border-[#FF5500]/30">
                Payment Required
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Settlement & Master Release
            </h3>
          </div>
        </div>

        {/* Balance Due Highlight */}
        <div className="flex flex-col sm:items-end bg-[#0D0D0F] px-4 py-2.5 rounded-xl border border-[#FF5500]/30">
          <span className="text-xs text-zinc-400 font-medium">Balance Due</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#FF5500] glow-text-ember">
            ₹{project.balanceDue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-zinc-500">
            Advance of ₹{project.advancePaid.toLocaleString('en-IN')} received.
          </span>
        </div>
      </div>

      {isPendingVerification ? (
        <div className="my-8 py-10 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#FFB800]/10 border-2 border-[#FFB800]/40 flex items-center justify-center text-[#FFB800] shadow-[0_0_30px_rgba(255,184,0,0.2)]">
              <Loader2 className="w-10 h-10 animate-spin-slow" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-6 h-6 text-[#FFB800] animate-pulse" />
            </div>
          </div>
          <div className="max-w-md">
            <h4 className="text-xl font-bold text-white mb-2">Payment Confirmation Sent!</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              David Music Studio is currently verifying your transaction. 
              {project.utrNote && <span className="block mt-2 font-mono text-[#FFB800]/80">Note: {project.utrNote}</span>}
            </p>
            <div className="mt-6 p-4 rounded-xl bg-[#0D0D0F] border border-[#FFB800]/30 text-xs text-zinc-300">
              Refresh this page in a few minutes. Once confirmed, your 24-bit lossless master WAV will unlock automatically.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main UPI Payment Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8">
            {/* Dynamic UPI QR Code Container */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0D0D0F] border border-[#FF5500]/20 shadow-inner">
              <div className="relative p-4 bg-white rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] glow-ember">
                <QRCodeSVG
                  value={upiDeepLink}
                  size={180}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                  Scan to Pay ₹{project.balanceDue}
                </span>
                <div className="flex items-center gap-1.5 opacity-60 grayscale brightness-200 mt-1 scale-75">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4" />
                </div>
              </div>
            </div>

            {/* UPI Details & Notification Form */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF5500]" />
                    <span>Pay via UPI App</span>
                  </h4>
                  <a
                    href={upiDeepLink}
                    className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF8800] text-white font-bold text-sm shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:shadow-[0_0_30px_rgba(255,85,0,0.5)] transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>Open UPI App to Pay</span>
                  </a>
                  <p className="text-[10px] text-zinc-500 mt-2 text-center">
                    Works with GPay, PhonePe, Paytm, Amazon Pay, etc.
                  </p>
                </div>

                <div className="h-px bg-white/[0.06] w-full" />

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                    Studio UPI ID
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0F] border border-white/[0.08]">
                    <span className="text-sm sm:text-base font-mono font-bold text-white select-all">
                      {studioUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161A] hover:bg-[#202026] text-xs font-semibold text-[#FFB800] border border-[#FFB800]/30 transition-all active:scale-95"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Request Flow */}
          <div className="pt-6 border-t border-white/[0.08]">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                <h4 className="text-sm font-bold text-zinc-200">I Have Paid — Notify Studio</h4>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={utrNote}
                    onChange={(e) => setUtrNote(e.target.value)}
                    placeholder="Enter Last 4 digits of UTR / Reference No."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0D0D0F] border border-white/[0.1] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFB800]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitVerification}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Payment Confirmation</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 italic ml-1">
                Submitting this notification alerts Engineer David to reconcile your payment and unlock the master vault.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Locked Master Download Button */}
      <div className="mt-6 pt-5 border-t border-white/[0.08]">
        <div className="relative group">
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-zinc-800/30 border border-zinc-800 text-zinc-600 font-bold text-sm sm:text-base cursor-not-allowed select-none"
            aria-disabled="true"
          >
            <Lock className="w-5 h-5" />
            <span>Download 24-Bit Master WAV (Locked)</span>
            <span className="text-xs font-mono opacity-50 hidden sm:inline">
              [{project.masterWavFileSize}]
            </span>
          </button>
          <div className="text-center mt-3 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF5500]/60" />
            Locked until outstanding balance (₹{project.balanceDue.toLocaleString('en-IN')}) is verified.
          </div>
        </div>
      </div>
    </div>
  );
};
