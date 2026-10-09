"use client";

import { useEffect, useRef, useState } from "react";

type VideoIntroProps = {
  visible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
};

export function VideoIntro({ visible, onComplete, onSkip }: VideoIntroProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadFallbackTimerRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const clearLoadFallbackTimer = () => {
    if (loadFallbackTimerRef.current !== null) {
      window.clearTimeout(loadFallbackTimerRef.current);
      loadFallbackTimerRef.current = null;
    }
  };

  const finishIntro = () => {
    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    clearLoadFallbackTimer();
    setIsFadingOut(true);
    window.setTimeout(() => {
      onComplete();
      setIsMounted(false);
    }, 420);
  };

  const handleSkip = () => {
    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    clearLoadFallbackTimer();
    setIsFadingOut(true);
    window.setTimeout(() => {
      onSkip?.();
      setIsMounted(false);
    }, 420);
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    hasCompletedRef.current = false;
    setIsMounted(true);
    document.body.style.overflow = "hidden";

    const fallbackTimer = window.setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        finishIntro();
      }
    }, 4000);

    loadFallbackTimerRef.current = fallbackTimer;

    return () => {
      clearLoadFallbackTimer();
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !videoRef.current) {
      return;
    }

    const playPromise = videoRef.current.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
  }, [visible]);

  if (!visible || !isMounted) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#FAF8F3",
        overflow: "hidden",
        opacity: isFadingOut ? 0 : 1,
        transition: "opacity 400ms ease",
      }}
    >
      <video
        ref={videoRef}
        src="/loading-screen.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="Company intro video"
        onLoadedData={clearLoadFallbackTimer}
        onCanPlay={clearLoadFallbackTimer}
        onEnded={finishIntro}
        onError={finishIntro}
        loop={false}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100vw",
          maxHeight: "100vh",
          objectFit: "cover",
          objectPosition: "center center",
          display: "block",
          background: "#FAF8F3",
        }}
      />

      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip intro video"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          zIndex: 1001,
          border: "1px solid rgba(11,27,59,0.16)",
          background: "rgba(255,255,255,0.72)",
          color: "#0B1B3B",
          borderRadius: 999,
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          backdropFilter: "blur(6px)",
        }}
        className="video-intro-skip"
      >
        Skip
      </button>

      <style jsx>{`
        .video-intro-skip {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        @media (max-width: 480px) {
          .video-intro-skip {
            right: 14px;
            bottom: 14px;
            padding: 7px 12px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
