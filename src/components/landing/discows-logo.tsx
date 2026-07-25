type DiscowsLogoProps = {
  size?: number
  className?: string
}

export function DiscowsLogo({ size = 64, className = "" }: DiscowsLogoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#080808] border border-white/10 transition-transform duration-500 hover:scale-105 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <defs>
          {/* Main Iridescent Spectrum Sweep */}
          <linearGradient id="iridescentSweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1b2a" />
            <stop offset="18%" stopColor="#22d3ee" />
            <stop offset="35%" stopColor="#9333ea" />
            <stop offset="52%" stopColor="#ec4899" />
            <stop offset="70%" stopColor="#facc15" />
            <stop offset="88%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Holographic Angular Light Flare */}
          <linearGradient id="lightFlare" x1="0" y1="0" x2="0.8" y2="0.8">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Black Container Background */}
        <rect width="100" height="100" fill="#050505" rx="22" />

        {/* Main Vinyl Record Quarter Arc */}
        <path d="M 0 0 L 98 0 A 98 98 0 0 1 0 98 Z" fill="url(#iridescentSweep)" />

        {/* Light Reflection Overlay */}
        <path d="M 0 0 L 98 0 A 98 98 0 0 1 0 98 Z" fill="url(#lightFlare)" />

        {/* Concentric Vinyl Grooves */}
        <circle cx="0" cy="0" r="28" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" fill="none" />
        <circle cx="0" cy="0" r="38" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none" />
        <circle cx="0" cy="0" r="48" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" fill="none" />
        <circle cx="0" cy="0" r="58" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none" />
        <circle cx="0" cy="0" r="68" stroke="rgba(0,0,0,0.35)" strokeWidth="0.7" fill="none" />
        <circle cx="0" cy="0" r="78" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none" />
        <circle cx="0" cy="0" r="88" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" fill="none" />
        <circle cx="0" cy="0" r="95" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="none" />

        {/* Center Hole Cutout */}
        <circle cx="0" cy="0" r="16" fill="#050505" />
        <circle cx="0" cy="0" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}
