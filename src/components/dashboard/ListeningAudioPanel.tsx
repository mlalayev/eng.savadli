"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ListeningAudioPanelProps = {
  src: string;
  /** e.g. "Listening · Section 1" */
  subtitle?: string;
};

export function ListeningAudioPanel({ src, subtitle }: ListeningAudioPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [buffering, setBuffering] = useState(false);

  const syncVolume = useCallback(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    syncVolume();
  }, [syncVolume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onDuration = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDuration);
    a.addEventListener("durationchange", onDuration);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDuration);
      a.removeEventListener("durationchange", onDuration);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) void a.pause();
    else void a.play().catch(() => {});
  }, [playing]);

  const seek = useCallback((ratio: number) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = Math.min(duration, Math.max(0, ratio * duration));
  }, [duration]);

  const progress = duration > 0 ? current / duration : 0;

  if (!src.trim()) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[var(--accent-soft)] blur-2xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Audio</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--text)]">Listening recording</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No audio is attached to this exam yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--accent-soft)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[var(--blob-soft)] blur-2xl"
        aria-hidden
      />

      <div className="relative p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Listening</p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl">Exam audio</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}

        <audio ref={audioRef} key={src} src={src} preload="metadata" className="hidden" />

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] shadow-md transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            {buffering ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--on-accent)] border-t-transparent" />
            ) : playing ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="ml-0.5 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div
              className="group relative h-2.5 cursor-pointer rounded-full bg-[var(--border)]"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label="Seek"
              onPointerDown={(e) => {
                const bar = e.currentTarget;
                const rect = bar.getBoundingClientRect();
                const move = (ev: PointerEvent) => {
                  const x = Math.min(rect.right, Math.max(rect.left, ev.clientX));
                  seek((x - rect.left) / rect.width);
                };
                move(e.nativeEvent);
                const up = () => {
                  window.removeEventListener("pointermove", move);
                  window.removeEventListener("pointerup", up);
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
              }}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-[width] duration-150"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] opacity-0 shadow transition group-hover:opacity-100"
                style={{ left: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-[var(--muted)]">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-5">
          <span className="text-[var(--faint)]" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--surface)] [&::-moz-range-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--surface)] [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-sm"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
