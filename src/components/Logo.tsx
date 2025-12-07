// Modern Premium B12 Vitamin Logo
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="capsuleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="capsuleShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main Capsule Shape */}
      <rect
        x="8"
        y="12"
        width="32"
        height="24"
        rx="12"
        fill="url(#capsuleGradient)"
      />

      {/* Capsule Divider Line */}
      <line
        x1="24"
        y1="12"
        x2="24"
        y2="36"
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.4"
      />

      {/* Shine Effect */}
      <ellipse
        cx="16"
        cy="18"
        rx="6"
        ry="4"
        fill="url(#capsuleShine)"
      />

      {/* B12 Text */}
      <text
        x="24"
        y="28"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="12"
        fontWeight="800"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        B12
      </text>
    </svg>
  );
}