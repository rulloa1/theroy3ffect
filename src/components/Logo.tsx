import React from "react";
import { Link } from "@tanstack/react-router";

export interface LogoProps {
  /** Display variant: 'mark' (icon only), 'compact' (icon + THE ROY EFFECT), or 'full' (icon + THE ROY EFFECT + CREATIVE & BRAND DIRECTION) */
  variant?: "mark" | "compact" | "full";
  /** Size preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Whether to wrap the logo in a link to homepage */
  href?: string | null;
  /** Optional interactive hover animations */
  interactive?: boolean;
}

export function LogoMark({ className = "size-8", animated = true }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`size-full transition-all duration-500 ease-out ${
          animated ? "group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(223,186,115,0.6)]" : ""
        }`}
        aria-hidden="true"
      >
        <defs>
          {/* Metallic Gold Gradient */}
          <linearGradient id="royGoldGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#FFF2D1" />
            <stop offset="25%" stopColor="#F5DC9E" />
            <stop offset="50%" stopColor="#DFBA73" />
            <stop offset="80%" stopColor="#BA8E3C" />
            <stop offset="100%" stopColor="#966C22" />
          </linearGradient>

          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA73" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F5DC9E" stopOpacity="1" />
            <stop offset="100%" stopColor="#966C22" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer Circular Reticle Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#ringGold)"
          strokeWidth="1.5"
          strokeDasharray="90 3 3 3"
          className="transition-transform duration-700 group-hover:rotate-45 origin-center"
        />

        {/* Inner Concentric Fine Ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#ringGold)"
          strokeWidth="1"
          strokeOpacity="0.7"
        />

        {/* Crosshair Cardinal Diamond Ticks & Reticles */}
        {/* Top 12 o'clock */}
        <polygon points="50,1 52.5,6 50,11 47.5,6" fill="url(#royGoldGrad)" />
        <line x1="50" y1="6" x2="50" y2="14" stroke="url(#royGoldGrad)" strokeWidth="1" />

        {/* Bottom 6 o'clock */}
        <polygon points="50,99 52.5,94 50,89 47.5,94" fill="url(#royGoldGrad)" />
        <line x1="50" y1="94" x2="50" y2="86" stroke="url(#royGoldGrad)" strokeWidth="1" />

        {/* Left 9 o'clock */}
        <polygon points="1,50 6,52.5 11,50 6,47.5" fill="url(#royGoldGrad)" />
        <line x1="6" y1="50" x2="14" y2="50" stroke="url(#royGoldGrad)" strokeWidth="1" />

        {/* Right 3 o'clock */}
        <polygon points="99,50 94,52.5 89,50 94,47.5" fill="url(#royGoldGrad)" />
        <line x1="94" y1="50" x2="86" y2="50" stroke="url(#royGoldGrad)" strokeWidth="1" />

        {/* Gold Letter 'R' with Plug / Connector Key Notch */}
        {/* Left Vertical Stem */}
        <path
          d="M 31 24 H 42.5 V 76 H 31 Z"
          fill="url(#royGoldGrad)"
        />

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
        <path
          d="M 52.5 50 L 73 76 H 60 L 42.5 54 H 50 Z"
          fill="url(#royGoldGrad)"
        />
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
    sm: { mark: "size-7", title: "text-sm", sub: "text-[7.5px]" },
    md: { mark: "size-10", title: "text-lg md:text-xl", sub: "text-[8.5px] md:text-[9.5px]" },
    lg: { mark: "size-12", title: "text-2xl", sub: "text-[10px]" },
    xl: { mark: "size-16", title: "text-4xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div
      className={`group inline-flex items-center gap-3.5 select-none ${
        interactive ? "cursor-pointer" : ""
      } ${className}`}
    >
      <LogoMark className={currentSize.mark} animated={interactive} />

      {variant !== "mark" && (
        <div className="flex flex-col justify-center text-left">
          <span
            className={`font-serif font-black tracking-[0.22em] text-white uppercase leading-tight transition-colors duration-300 group-hover:text-[#F5DC9E] ${currentSize.title}`}
          >
            THE ROY EFFECT
          </span>

          {variant === "full" && (
            <span
              className={`mt-0.5 font-mono tracking-[0.28em] text-[#C5A059] uppercase leading-none font-medium ${currentSize.sub}`}
            >
              CREATIVE &amp; BRAND DIRECTION
            </span>
          )}
        </div>
      )}
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
