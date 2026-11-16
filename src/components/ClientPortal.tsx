import React, { useState, useEffect } from 'react';
import { Flame, Shield, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { ClientProject, StudioSettings } from '../types.ts';
import { getTrackById } from '../firebase/firestore.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import { UpiPaymentCard } from './UpiPaymentCard.tsx';
import { MasterDownloadCard } from './MasterDownloadCard.tsx';

interface ClientPortalProps {
  projectId: string;
  settings: StudioSettings;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  isAdminLoggedIn?: boolean;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  projectId,
  settings,
  onShowToast,
  isAdminLoggedIn = false,
}) => {
  const [project, setProject] = useState<ClientProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProject() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const track = await getTrackById(projectId);
        if (!isMounted) return;

        if (!track) {
          setLoadError('Track record not found. Please contact David Music Studio.');
        } else {
          // CRUCIAL SECURITY ENFORCEMENT:
          // If isPaid is false, strictly omit masterWavUrl from frontend state
          const sanitizedProject: ClientProject = {
            ...track,
            masterWavUrl: track.isPaid ? track.masterWavUrl : undefined,
          };
          setProject(sanitizedProject);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Error fetching track:', err);
        setLoadError('Unable to load client track. Please verify your share link.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }

    return () => {
      isMounted = false;
    };
  }, [projectId]);


  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-xl bg-[#16161A] border border-[#FF5500]/40 flex items-center justify-center glow-ember">
          <Flame className="w-6 h-6 text-[#FF5500] animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-semibold text-white">Opening Secure Studio Vault...</div>
          <div className="text-xs text-zinc-500 font-mono">Verifying Document ID: {projectId}</div>
        </div>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl bg-[#16161A] border border-white/[0.08] p-8 text-center space-y-4 glow-ember">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Track Not Found</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {loadError || 'The requested audio track link could not be located in the studio database.'}
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>David Music Studio Home</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isPaidInFull = project.isPaid || project.balanceDue === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Studio Header Presentation */}
      <div className="text-center space-y-2 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16161A] border border-[#FF5500]/30 text-xs font-mono text-[#FFB800]">
          <Flame className="w-3.5 h-3.5 text-[#FF5500] animate-pulse" />
          <span>DAVID MUSIC STUDIO — MASTER VAULT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {project.songTitle}
        </h1>
        <div className="text-sm text-zinc-400 flex items-center justify-center gap-2">
          <span>
            Mastering Produced for <strong className="text-zinc-200">{project.clientName}</strong>
          </span>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <span className="font-mono text-zinc-500">{project.genre}</span>
        </div>
      </div>

      {/* Audio Preview Player Section */}
      {/* SECURITY: Only watermarked MP3 preview is loaded here */}
      <section aria-label="Audio preview player">
        <AudioPlayer
          audioUrl={project.audioPreviewUrl}
          songTitle={project.songTitle}
          clientName={project.clientName}
          genre={project.genre}
          tempoBpm={project.tempoBpm}
        />
      </section>

      {/* Conditional Download & Payment Section */}
      <section aria-label="Master delivery and payment status">
        {isPaidInFull ? (
          <MasterDownloadCard
            project={project}
            onShowToast={onShowToast}
          />
        ) : (
          <UpiPaymentCard
            project={project}
            settings={settings}
            onShowToast={onShowToast}
          />
        )}
      </section>

      {/* Studio Trust & Mastering Footer Note */}
      <div className="text-center text-xs text-zinc-500 pt-6 pb-12 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Authentic 24-Bit / 96kHz Lossless Broadcast Guarantee</span>
        </div>
        <p>David Music Studio · Mumbai · Custom Audio Mastering & Delivery</p>
      </div>
    </div>
  );
};
