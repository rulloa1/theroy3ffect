import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/roy-effect-logo-192.webp.asset.json";

export interface LogoProps {
  variant?: "mark" | "compact" | "full" | "stacked" | "responsive";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
  interactive?: boolean;
}

const sizeClasses = {
  sm: "size-11 sm:size-12",
  md: "size-16 md:size-20",
  lg: "size-24 md:size-28",
  xl: "size-36 md:size-44",
};

export function LogoMark({
  className = "size-11",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
  drawOnMount?: boolean;
}) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <img
        src={logoAsset.url}
        alt=""
        width={192}
        height={192}
        decoding="async"
        className={`size-full object-contain transition duration-300 motion-reduce:transition-none ${
          animated ? "group-hover:scale-[1.03] group-hover:drop-shadow-[0_0_14px_rgba(255,51,51,0.4)]" : ""
        }`}
      />
    </span>
  );
}

export function Logo({
  size = "md",
  className = "",
  href = "/",
  interactive = true,
}: LogoProps) {
  const content = (
    <span className={`group inline-flex items-center justify-center select-none ${interactive ? "cursor-pointer" : ""}`}>
      <LogoMark className={sizeClasses[size]} animated={interactive} />
    </span>
  );

  if (href) {
    return (
      <Link to={href} className={`inline-flex shrink-0 outline-none ${className}`} aria-label="The Roy Effect home">
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}