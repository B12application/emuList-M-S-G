import { motion } from 'framer-motion';

interface B12LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function B12Logo({ className = '', size = 'md' }: B12LogoProps) {
    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-12 h-12',
        lg: 'w-14 h-14',
    };

    return (
        <motion.div
            className={`${sizeClasses[size]} ${className}`}
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
            <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-lg"
            >
                <defs>
                    <linearGradient id="logoBgGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#1F2937" />
                        <stop offset="1" stopColor="#0F172A" />
                    </linearGradient>

                    <linearGradient id="logoAccentGradient" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F59E0B" />
                        <stop offset="1" stopColor="#F97316" />
                    </linearGradient>

                    <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="1.2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#logoBgGradient)" />
                <rect x="5" y="5" width="38" height="38" rx="10" stroke="url(#logoAccentGradient)" strokeOpacity="0.65" strokeWidth="1.3" />

                <rect x="12" y="11" width="24" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.16" />

                <text
                    x="24"
                    y="24"
                    fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
                    fontSize="14"
                    fontWeight="900"
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: '-0.35px' }}
                >
                    B12
                </text>

                {/* 4 content categories + planner timeline */}
                <circle cx="15" cy="33" r="2.1" fill="#38BDF8" filter="url(#logoGlow)" />
                <circle cx="22" cy="33" r="2.1" fill="#F43F5E" filter="url(#logoGlow)" />
                <circle cx="29" cy="33" r="2.1" fill="#22C55E" filter="url(#logoGlow)" />
                <circle cx="36" cy="33" r="2.1" fill="#A78BFA" filter="url(#logoGlow)" />
                <path d="M13 38H35" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        </motion.div>
    );
}
