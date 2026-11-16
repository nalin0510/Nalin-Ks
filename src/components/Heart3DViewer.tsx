import React, { useEffect, useRef, useState } from 'react';
import { HeartPulse, Maximize2, Minimize2 } from 'lucide-react';
import { AnatomyStructureId } from '../types/cardio';

interface Heart3DViewerProps {
  compact?: boolean;
  heroMode?: boolean;
  initialShowLabels?: boolean;
  onStructureSelect?: (id: AnatomyStructureId) => void;
}

const SKETCHFAB_EMBED_URL =
  'https://sketchfab.com/models/9cabb809b4c94a48a3fe52e9adb6effe/embed?autostart=1&ui_theme=dark';

const EXTRA_IFRAME_ATTRS: Record<string, string | boolean> = {
  mozallowfullscreen: 'true',
  webkitallowfullscreen: 'true',
  'xr-spatial-tracking': true,
  'execution-while-out-of-viewport': true,
  'execution-while-not-rendered': true,
  'web-share': true,
};

export function Heart3DViewer({
  compact = false,
  heroMode = false,
}: Heart3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const heightClass = isFullscreen
    ? 'h-screen w-screen rounded-none border-0'
    : compact
    ? 'h-[360px]'
    : heroMode
    ? 'h-[440px] sm:h-[500px] lg:h-[550px]'
    : 'h-[460px] sm:h-[560px] lg:h-[640px]';

  return (
    <div
      ref={containerRef}
      className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#060A13] ${heightClass}`}
    >
      {/* Top Medical Viewport Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#070B14]/95 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <HeartPulse className="h-4 w-4 shrink-0 text-rose-400" />
          <span className="truncate text-xs font-semibold tracking-wide text-slate-100">
            Realistic 3D Heart Model
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!compact && (
            <span className="hidden text-[11px] font-mono text-slate-400 sm:inline">
              Drag to rotate · Scroll / pinch to zoom
            </span>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen 3D view'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen 3D view'}
            className="flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0B111E] px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Responsive Sketchfab 3D Embed Panel */}
      <div className="relative min-h-0 w-full flex-1 bg-[#04070E]">
        {!iframeLoaded && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#04070E]/90 text-center">
            <HeartPulse className="h-6 w-6 animate-pulse text-rose-400" />
            <span className="font-mono text-xs text-slate-400">
              Loading 3D anatomical heart viewer...
            </span>
          </div>
        )}

        <div className="sketchfab-embed-wrapper h-full w-full">
          <iframe
            title="Realistic Heart Animated"
            src={SKETCHFAB_EMBED_URL}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            loading="eager"
            onLoad={() => setIframeLoaded(true)}
            className="block h-full w-full border-0"
            {...EXTRA_IFRAME_ATTRS}
          />
        </div>
      </div>

      {/* Required Sketchfab Attribution Footer */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-[#070B14] px-3.5 py-2">
        <p className="m-0 text-[12px] font-normal text-slate-400">
          <a
            href="https://sketchfab.com/3d-models/realistic-heart-animated-9cabb809b4c94a48a3fe52e9adb6effe"
            target="_blank"
            rel="nofollow noreferrer"
            className="font-semibold text-[#1CAAD9] hover:underline"
          >
            Realistic Heart Animated
          </a>{' '}
          by{' '}
          <a
            href="https://sketchfab.com/flarar"
            target="_blank"
            rel="nofollow noreferrer"
            className="font-semibold text-[#1CAAD9] hover:underline"
          >
            flarar-01
          </a>{' '}
          on{' '}
          <a
            href="https://sketchfab.com"
            target="_blank"
            rel="nofollow noreferrer"
            className="font-semibold text-[#1CAAD9] hover:underline"
          >
            Sketchfab
          </a>
        </p>

        <span className="font-mono text-[10px] text-slate-500">
          {compact ? 'Independent animation' : 'Original Sketchfab animation · Independent of simulated BPM'}
        </span>
      </div>
    </div>
  );
}
