import React from "react";
import { Link } from "@tanstack/react-router";

export interface LogoProps {
  /** Display variant:
   * - 'mark': Gold seal emblem only
   * - 'compact': Emblem + THE ROY EFFECT
   * - 'full': Horizontal (Emblem + THE ROY EFFECT + DIRT, REFINED INTO GOLD)
   * - 'stacked': Vertical centered (Emblem on top + THE ROY EFFECT + DIRT, REFINED INTO GOLD)
   */
  variant?: "mark" | "compact" | "full" | "stacked" | "responsive";
  /** Size preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Whether to wrap the logo in a link to homepage */
  href?: string | null;
  /** Optional interactive hover animations */
  interactive?: boolean;
}

export function LogoMark({
  className = "size-9",
  animated = true,
  drawOnMount = true,
}: {
  className?: string;
  animated?: boolean;
  drawOnMount?: boolean;
}) {
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`size-full transition-all duration-500 ease-out ${
          animated
            ? "group-hover:scale-105 group-hover:drop-shadow-[0_0_16px_rgba(223,186,115,0.65)]"
            : ""
        }`}
        aria-hidden="true"
      >
        <defs>
          {/* Liquid Gold Shader Gradient */}
          <linearGradient id="royGoldGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#FFF4D6" />
            <stop offset="25%" stopColor="#F6DC9A" />
            <stop offset="50%" stopColor="#DFBA73" />
            <stop offset="80%" stopColor="#B88A36" />
            <stop offset="100%" stopColor="#8E651E" />
          </linearGradient>

          <linearGradient id="royRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA73" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#F6DC9A" stopOpacity="1" />
            <stop offset="100%" stopColor="#966C22" stopOpacity="0.85" />
          </linearGradient>

          {/* Stroke Draw Keyframes */}
          <style>{`
            @keyframes drawOuterRing {
              0% { stroke-dasharray: 290; stroke-dashoffset: 290; opacity: 0; }
              100% { stroke-dasharray: 290; stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes drawInnerRing {
              0% { stroke-dasharray: 255; stroke-dashoffset: 255; opacity: 0; }
              100% { stroke-dasharray: 255; stroke-dashoffset: 0; opacity: 0.75; }
            }
            @keyframes drawLetterR {
              0% { opacity: 0; transform: scale(0.92); }
              100% { opacity: 1; transform: scale(1); }
            }
            .animate-outer-ring {
              animation: drawOuterRing 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .animate-inner-ring {
              animation: drawInnerRing 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
            }
            .animate-letter-r {
              transform-origin: 50px 50px;
              animation: drawLetterR 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
            }
          `}</style>
        </defs>

        {/* Outer Circular Reticle Ring */}
        <circle
          cx="50"
          cy="50"
          r="45.5"
          stroke="url(#royRingGold)"
          strokeWidth="1.6"
          strokeDasharray="90 3 3 3"
          className={`origin-center transition-transform duration-700 group-hover:rotate-45 ${
            drawOnMount ? "animate-outer-ring" : ""
          }`}
        />

        {/* Inner Concentric Fine Ring */}
        <circle
          cx="50"
          cy="50"
          r="39.5"
          stroke="url(#royRingGold)"
          strokeWidth="1"
          strokeOpacity="0.75"
          className={drawOnMount ? "animate-inner-ring" : ""}
        />

        {/* Cardinal Crosshair Diamonds & Tick Reticles */}
        <g className="transition-opacity duration-500">
          {/* Top 12 o'clock */}
          <polygon points="50,1 52.5,5.5 50,10 47.5,5.5" fill="url(#royGoldGrad)" />
          <line x1="50" y1="5.5" x2="50" y2="13" stroke="url(#royGoldGrad)" strokeWidth="1" />

          {/* Bottom 6 o'clock */}
          <polygon points="50,99 52.5,94.5 50,90 47.5,94.5" fill="url(#royGoldGrad)" />
          <line x1="50" y1="94.5" x2="50" y2="87" stroke="url(#royGoldGrad)" strokeWidth="1" />

          {/* Left 9 o'clock */}
          <polygon points="1,50 5.5,52.5 10,50 5.5,47.5" fill="url(#royGoldGrad)" />
          <line x1="5.5" y1="50" x2="13" y2="50" stroke="url(#royGoldGrad)" strokeWidth="1" />

          {/* Right 3 o'clock */}
          <polygon points="99,50 94.5,52.5 90,50 94.5,47.5" fill="url(#royGoldGrad)" />
          <line x1="94.5" y1="50" x2="87" y2="50" stroke="url(#royGoldGrad)" strokeWidth="1" />
        </g>

        {/* Gold Letter 'R' with Connector Key Notch */}
        <g className={drawOnMount ? "animate-letter-r" : ""}>
          {/* Left Vertical Stem */}
          <path d="M 31 24 H 42.5 V 76 H 31 Z" fill="url(#royGoldGrad)" />

          {/* Upper Loop of 'R' with Male Connector Notch Detail */}
          <path
            d="M 42.5 24 H 60 C 71 24 77 30 77 40 C 77 48 70 54 59 54 H 42.5 V 24 Z 
               M 42.5 33 V 45 H 58 C 62.5 45 66 43 66 40 C 66 37 62.5 33 58 33 H 42.5 Z"
            fill="url(#royGoldGrad)"
          />

          {/* Plug / Connector Key Notch Projection on the R */}
          <path
            d="M 66 38 H 74 V 42 H 66 Z 
               M 74 36.5 H 76 V 43.5 H 74 Z"
            fill="url(#royGoldGrad)"
          />

          {/* Diagonal Dynamic Leg */}
          <path d="M 52.5 50 L 73 76 H 60 L 42.5 54 H 50 Z" fill="url(#royGoldGrad)" />
        </g>
      </svg>
    </div>
  );
}

export function Logo({
  variant = "full",
  size = "md",
  className = "",
  href = "/",
  interactive = true,
}: LogoProps) {
  const sizeMap = {
    sm: { mark: "size-7", title: "text-sm sm:text-base", sub: "text-[7px] sm:text-[8px]" },
    md: {
      mark: "size-9 md:size-10",
      title: "text-lg md:text-xl",
      sub: "text-[8px] md:text-[9.5px]",
    },
    lg: {
      mark: "size-14 md:size-16",
      title: "text-2xl md:text-3xl",
      sub: "text-[10px] md:text-xs",
    },
    xl: { mark: "size-20 md:size-24", title: "text-3xl md:text-5xl", sub: "text-xs md:text-sm" },
  };

  const currentSize = sizeMap[size];

  // Vertical Centered / Stacked Hero Variant
  if (variant === "stacked") {
    const content = (
      <div
        className={`group inline-flex flex-col items-center justify-center text-center select-none ${
          interactive ? "cursor-pointer" : ""
        } ${className}`}
      >
        <LogoMark className={currentSize.mark} animated={interactive} />
        <span
          className={`mt-4 font-serif font-black tracking-[0.24em] text-white uppercase leading-tight transition-colors duration-300 group-hover:text-[#F6DC9A] ${currentSize.title}`}
        >
          THE ROY EFFECT
        </span>
        <span
          className={`mt-1.5 font-mono tracking-[0.34em] text-[#DFBA73] uppercase leading-none font-semibold ${currentSize.sub}`}
        >
          DIRT, REFINED INTO GOLD
        </span>
      </div>
    );

    if (href) {
      return (
        <Link to={href} className="inline-flex outline-none" aria-label="The Roy Effect Home">
          {content}
        </Link>
      );
    }
    return content;
  }

  // Horizontal Variant (Mark / Compact / Full) — uses the restored brand lockup
  const lockupHeight = {
    sm: "h-6 sm:h-7",
    md: "h-8 md:h-9",
    lg: "h-11 md:h-12",
    xl: "h-14 md:h-16",
  }[size];

  const content =
    variant === "mark" ? (
      <div
        className={`group inline-flex items-center select-none ${
          interactive ? "cursor-pointer" : ""
        } ${href ? "" : className}`}
      >
        <LogoMark className={currentSize.mark} animated={interactive} />
      </div>
    ) : (
      <div
        className={`group inline-flex items-center select-none ${
          interactive ? "cursor-pointer" : ""
        } ${href ? "" : className}`}
      >
        <img
          src="/brand/roy-effect-logo.png"
          alt="The Roy Effect — dirt, refined into gold"
          width={2292}
          height={307}
          className={`w-auto max-w-full object-contain transition-all duration-300 ${lockupHeight} ${
            interactive ? "group-hover:drop-shadow-[0_0_16px_rgba(223,186,115,0.45)]" : ""
          }`}
        />
      </div>
    );


  if (href) {
    return (
      <Link to={href} className={`outline-none ${className}`} aria-label="The Roy Effect Home">
        {content}
      </Link>
    );
  }

  return content;
}
