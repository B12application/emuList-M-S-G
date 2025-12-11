// src/components/LoginPanda.tsx

interface PandaProps {
  isWatching: boolean;
}

export default function LoginPanda({ isWatching }: PandaProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 md:w-56 mx-auto"
    >
      {/* Defs for gradients and effects */}
      <defs>
        <radialGradient id="pandaWhite" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F5F5" />
        </radialGradient>
        <radialGradient id="blushGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sol Kulak */}
      <ellipse
        cx="60" cy="50" rx="28" ry="32"
        fill="#2A2A2A"
        className="transition-transform duration-300"
      />

      {/* Sağ Kulak */}
      <ellipse
        cx="140" cy="50" rx="28" ry="32"
        fill="#2A2A2A"
        className="transition-transform duration-300"
      />

      {/* Ana Yüz */}
      <circle
        cx="100" cy="100" r="65"
        fill="url(#pandaWhite)"
        stroke="#E0E0E0"
        strokeWidth="1"
      />

      {/* Sol Göz Çevresi (her zaman görünür) */}
      <ellipse
        cx="75" cy="85" rx="20" ry="24"
        fill="#2A2A2A"
      />

      {/* Sağ Göz Çevresi (her zaman görünür) */}
      <ellipse
        cx="125" cy="85" rx="20" ry="24"
        fill="#2A2A2A"
      />

      {/* Gözler - Açık Durum */}
      <g
        style={{
          opacity: isWatching ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Sol Göz - Beyaz  */}
        <circle cx="75" cy="85" r="12" fill="#FFFFFF" />
        {/* Sol Göz - Göz Bebeği */}
        <circle cx="75" cy="85" r="8" fill="#1A1A1A" />
        {/* Sol Göz - Parlak Nokta */}
        <circle cx="78" cy="82" r="3" fill="#FFFFFF" />

        {/* Sağ Göz - Beyaz */}
        <circle cx="125" cy="85" r="12" fill="#FFFFFF" />
        {/* Sağ Göz - Göz Bebeği */}
        <circle cx="125" cy="85" r="8" fill="#1A1A1A" />
        {/* Sağ Göz - Parlak Nokta */}
        <circle cx="128" cy="82" r="3" fill="#FFFFFF" />
      </g>

      {/* Gözler - Kapalı Durum (Kavisli Çizgiler) */}
      <g
        style={{
          opacity: isWatching ? 0 : 1,
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Sol Göz Kapalı - Kavisli çizgi */}
        <path
          d="M 63 85 Q 75 92, 87 85"
          stroke="#1A1A1A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Sol Göz Kirpikler */}
        <line x1="63" y1="85" x2="60" y2="80" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="75" y1="92" x2="75" y2="97" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="87" y1="85" x2="90" y2="80" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />

        {/* Sağ Göz Kapalı - Kavisli çizgi */}
        <path
          d="M 113 85 Q 125 92, 137 85"
          stroke="#1A1A1A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Sağ Göz Kirpikler */}
        <line x1="113" y1="85" x2="110" y2="80" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="125" y1="92" x2="125" y2="97" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="137" y1="85" x2="140" y2="80" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Burun */}
      <ellipse
        cx="100" cy="110" rx="12" ry="10"
        fill="#2A2A2A"
      />
      {/* Burun Parlama */}
      <ellipse
        cx="97" cy="108" rx="4" ry="3"
        fill="#FFFFFF"
        opacity="0.6"
      />

      {/* Ağız */}
      <path
        d="M 100 110 L 100 120"
        stroke="#2A2A2A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 100 120 Q 90 130, 80 125"
        stroke="#2A2A2A"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 100 120 Q 110 130, 120 125"
        stroke="#2A2A2A"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sol Yanak Alı */}
      <circle
        cx="50" cy="105" r="15"
        fill="url(#blushGradient)"
      />

      {/* Sağ Yanak Alı */}
      <circle
        cx="150" cy="105" r="15"
        fill="url(#blushGradient)"
      />
    </svg>
  );
}
