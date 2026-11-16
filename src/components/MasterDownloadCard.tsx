import React, { useState } from 'react';
import { Download, Unlock, CheckCircle2, FileAudio, Disc3, Sparkles, ShieldCheck, Flame, RotateCcw } from 'lucide-react';
import { ClientProject } from '../types.ts';
import { generateMasterWavBlob } from '../utils/audioSynthesizer.ts';

interface MasterDownloadCardProps {
  project: ClientProject;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onTogglePendingDemo?: (projectId: string) => void;
}

export const MasterDownloadCard: React.FC<MasterDownloadCardProps> = ({
  project,
  onShowToast,
  onTogglePendingDemo,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadMaster = () => {
    setIsDownloading(true);
    setDownloadProgress(20);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setIsDownloading(false);
      setDownloadProgress(0);

      if (project.masterWavUrl && project.masterWavUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = project.masterWavUrl;
        link.target = '_blank';
        link.download = project.masterWavFileName || `${project.songTitle.replace(/\s+/g, '_')}_Master_24bit.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate real 24-bit WAV blob
        const blob = generateMasterWavBlob(project.songTitle, 6);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = project.masterWavFileName || `${project.songTitle.replace(/\s+/g, '_')}_Master_24bit.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      onShowToast(`Downloaded Master: ${project.masterWavFileName}`, 'success');
    }, 1200);
  };

  return (
    <div className="relative rounded-2xl bg-[#16161A] border-2 border-[#FFB800]/70 p-6 sm:p-8 shadow-2xl glow-gold overflow-hidden transition-all duration-300">
      {/* Background Gold Shimmer */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#FFB800]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner: Unlocked & Paid in Full */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#FF5500] p-[1.5px] shadow-[0_0_20px_rgba(255,184,0,0.4)]">
            <div className="w-full h-full bg-[#16161A] rounded-[10px] flex items-center justify-center text-[#FFB800]">
              <Unlock className="w-5 h-5 text-[#FFB800]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-[#FFB800] font-bold">
                Master Released
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40">
                {project.paymentStatus}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              24-Bit Studio Master Vault
            </h3>
          </div>
        </div>

        {/* Balance Zero Badge */}
        <div className="flex flex-col sm:items-end bg-[#0D0D0F] px-4 py-2.5 rounded-xl border border-[#FFB800]/40 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Balance Settled</span>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#FFB800] glow-text-gold">
            ₹0 Balance Due
          </span>
          <span className="text-[11px] text-zinc-400">
            Full Fee of ₹{project.totalAmount.toLocaleString('en-IN')} Received
          </span>
        </div>
      </div>

      {/* Audio Mastering Specifications Strip */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Resolution & Depth
          </span>
          <span className="text-sm font-mono font-bold text-white mt-1 block">
            {project.sampleRate}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Integrated Loudness
          </span>
          <span className="text-sm font-mono font-bold text-[#FFB800] mt-1 block">
            {project.lufsIntegrated}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            True Peak Ceiling
          </span>
          <span className="text-sm font-mono font-bold text-white mt-1 block">
            {project.truePeak}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Uncompressed Size
          </span>
          <span className="text-sm font-mono font-bold text-white mt-1 block">
            {project.masterWavFileSize}
          </span>
        </div>
      </div>

      {/* Master File Overview Card */}
      <div className="relative z-10 p-4 rounded-xl bg-[#0D0D0F]/90 border border-[#FFB800]/25 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 shrink-0">
            <FileAudio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight break-all font-mono">
              {project.masterWavFileName}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>Lossless PCM Broadcast WAV</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Stereo Master</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-medium">No Watermark</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
          <span>David Music Studio Certified</span>
        </div>
      </div>

      {/* Active 24-Bit Master WAV Download CTA */}
      <div className="relative z-10 space-y-3">
        <button
          type="button"
          onClick={handleDownloadMaster}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-[#FFB800] via-[#FF8800] to-[#FF5500] text-black font-extrabold text-base sm:text-lg shadow-[0_0_25px_rgba(255,184,0,0.5)] hover:shadow-[0_0_40px_rgba(255,184,0,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Preparing Lossless Stream ({downloadProgress}%)...</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6 stroke-[2.5]" />
              <span>Download 24-Bit Master WAV</span>
              <span className="text-xs font-mono bg-black/20 text-black px-2 py-0.5 rounded font-bold hidden sm:inline">
                {project.masterWavFileSize}
              </span>
            </>
          )}
        </button>

        {/* Testing helper to re-lock during review */}
        {onTogglePendingDemo && (
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
            <span>Official client delivery receipt active.</span>
            <button
              type="button"
              onClick={() => onTogglePendingDemo(project.id)}
              className="flex items-center gap-1 text-[#FF5500] hover:text-white transition-colors underline decoration-[#FF5500]/50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Demo: Toggle Back to Pending State</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
