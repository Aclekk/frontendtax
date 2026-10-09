import React from "react";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* Scanline overlay */}
      <div className="scanlines pointer-events-none absolute inset-0" />

      {/* Loading text — single layer, white sweep masked directly onto letters */}
      <div className="relative select-none px-4">
        <h1 className="sweep-text text-[10vw] sm:text-[64px] md:text-[90px] leading-none font-extrabold tracking-tight uppercase whitespace-nowrap">
          DELAMIBRANDS
        </h1>
      </div>

      <style jsx>{`
        .sweep-text {
          color: transparent;
          -webkit-text-stroke: 1.5px #ffffff;
          background: linear-gradient(
            to right,
            #ffffff 0%,
            #ffffff 50%,
            #000000 50%,
            #000000 100%
          );
          background-size: 200% 100%;
          background-position: 100% 0;
          -webkit-background-clip: text;
          background-clip: text;
          animation: sweep-fill 3.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes sweep-fill {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

        .scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.025) 0px,
            rgba(255, 255, 255, 0.025) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
}