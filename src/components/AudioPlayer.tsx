import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';
import { fallbackAudioEngine } from '../utils/audioSynthesizer.ts';

interface AudioPlayerProps {
  audioUrl: string;
  songTitle: string;
  clientName: string;
  genre?: string;
  tempoBpm?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  songTitle,
  clientName,
  genre,
  tempoBpm,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(45); // default fallback duration
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [useFallbackSynth, setUseFallbackSynth] = useState(false);
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [scrubberHoverTime, setScrubberHoverTime] = useState(0);
  const [watermarkPing, setWatermarkPing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  // Initialize and handle audio src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    fallbackAudioEngine.stop();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Handle play / pause toggle
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (useFallbackSynth) {
        fallbackAudioEngine.pause();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (useFallbackSynth) {
        fallbackAudioEngine.play(
          (time) => setCurrentTime(time),
          () => setIsPlaying(false)
        );
        setIsPlaying(true);
      } else if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn('Native audio play error, switching to Web Audio synth fallback:', err);
              setUseFallbackSynth(true);
              fallbackAudioEngine.play(
                (time) => setCurrentTime(time),
                () => setIsPlaying(false)
              );
              setIsPlaying(true);
            });
        }
      }
    }
  }, [isPlaying, useFallbackSynth]);

  // Periodic visual watermark ping to remind client this is a preview
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWatermarkPing(true);
      setTimeout(() => setWatermarkPing(false), 2000);
    }, 18000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Audio element event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current && !useFallbackSynth) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = () => {
    // If remote audio fails to load (CORS / network), seamlessly enable fallback synth
    setUseFallbackSynth(true);
    setDuration(45);
  };

  // Scrubber seeking
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;

    setCurrentTime(targetTime);

    if (useFallbackSynth) {
      fallbackAudioEngine.seek(targetTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubberHoverTime(pos * duration);
    setIsHoveringScrubber(true);
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVol = volume === 0 ? 0.8 : volume;
      setVolume(restoreVol);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = restoreVol;
        audioRef.current.muted = false;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
    }
  };

  const restartTrack = () => {
    setCurrentTime(0);
    if (useFallbackSynth) {
      fallbackAudioEngine.seek(0);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Visualizer animated bars (28 bars)
  const barHeights = [
    35, 60, 45, 80, 95, 65, 40, 75, 90, 100, 85, 70, 50, 65, 80, 95, 70, 85,
    60, 40, 75, 90, 85, 60, 45, 70, 55, 30,
  ];

  return (
    <div className="relative rounded-2xl bg-[#16161A] border border-[#FF5500]/30 shadow-2xl p-6 glow-ember overflow-hidden">
      {/* Background Ember Aura */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FFB800]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      {/* Player Header: Song Info & Watermark Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {songTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>Client: <strong className="text-zinc-200">{clientName}</strong></span>
            {genre && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{genre}</span>
              </>
            )}
            {tempoBpm && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono">{tempoBpm} BPM</span>
              </>
            )}
          </div>
        </div>

        {/* Studio Preview Watermark Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
          watermarkPing
            ? 'bg-[#FF5500]/20 border-[#FF5500] text-[#FFB800] glow-ember'
            : 'bg-[#0D0D0F] border-[#FF5500]/30 text-amber-400'
        }`}>
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
          <span className="tracking-wide">Watermarked Studio Preview (128kbps MP3)</span>
        </div>
      </div>

      {/* Simulated Fire Spectrum Visualizer */}
      <div className="h-14 flex items-end justify-between gap-[3px] px-1 mb-5 select-none overflow-hidden">
        {barHeights.map((maxH, index) => {
          // Dynamic scaling when playing
          const dynamicScale = isPlaying
            ? Math.min(1, Math.max(0.2, (Math.sin((currentTime * 8) + index * 0.4) + 1) / 2))
            : 0.2;
          const currentHeight = Math.max(6, Math.floor(maxH * dynamicScale));
          const isPassed = (index / barHeights.length) * 100 <= progressPercent;

          return (
            <div
              key={index}
              style={{ height: `${currentHeight}%` }}
              className={`flex-1 rounded-t transition-all duration-150 ${
                isPassed
                  ? 'bg-gradient-to-t from-[#FF5500] via-[#FF8800] to-[#FFB800] shadow-[0_0_8px_rgba(255,85,0,0.5)]'
                  : isPlaying
                  ? 'bg-zinc-700 hover:bg-zinc-600'
                  : 'bg-zinc-800'
              }`}
            />
          );
        })}
      </div>

      {/* Scrubber Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={() => setIsHoveringScrubber(false)}
          className="group relative h-3 w-full bg-zinc-800/80 rounded-full cursor-pointer flex items-center overflow-hidden transition-all duration-150 hover:h-3.5"
          role="slider"
          aria-label="Audio scrubber"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
        >
          {/* Filled Progress Gradient */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-[#FF5500] via-[#FF8800] to-[#FFB800] rounded-full relative shadow-[0_0_12px_rgba(255,85,0,0.6)]"
          >
            {/* Scrubber Thumb Knob */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_#FF5500] border border-[#FF5500] scale-0 group-hover:scale-100 transition-transform" />
          </div>

          {/* Hover Time Indicator */}
          {isHoveringScrubber && (
            <div
              style={{ left: `${(scrubberHoverTime / duration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none"
            />
          )}
        </div>

        {/* Time Counters */}
        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400">
          <span className="text-zinc-200 font-medium">{formatTime(currentTime)}</span>
          <span className="text-zinc-500">Duration: {formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Controls Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="relative group p-4 rounded-full bg-gradient-to-tr from-[#FF5500] to-[#FFB800] text-black font-bold shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black ml-0.5" />
            )}
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Restart Button */}
          <button
            type="button"
            onClick={restartTrack}
            className="p-2.5 rounded-lg bg-[#0D0D0F] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-[#FF5500]/40 transition-colors"
            title="Restart Track"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs text-zinc-400 hidden sm:block">
            <span className="text-zinc-200 font-medium">Studio Engine:</span>{' '}
            {useFallbackSynth ? 'Harmonic Rhodes Fallback' : 'HQ 128k MP3 Stream'}
          </div>
        </div>

        {/* Volume & Audio Specs */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#FFB800]" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
            aria-label="Volume slider"
          />

          <div className="px-2.5 py-1 rounded bg-[#0D0D0F] border border-white/[0.06] text-[11px] font-mono text-zinc-400">
            128kbps / 44.1kHz
          </div>
        </div>
      </div>
    </div>
  );
};
