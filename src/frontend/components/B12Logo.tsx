// Modern Premium B12 Logo - Minimal & Elegant
import { motion } from 'framer-motion';

interface B12LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function B12Logo({ className = '', size = 'md' }: B12LogoProps) {
    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20',
    };

    return (
        <motion.div
            className={`relative ${sizeClasses[size]} ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
            
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10 drop-shadow-2xl"
            >
                <defs>
                    <linearGradient id="logoGrad" x1="0" y1="0" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#881337" />
                    </linearGradient>
                    
                    <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Geometric Main Container */}
                <path
                    d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
                    fill="url(#logoGrad)"
                    className="drop-shadow-sm"
                />
                
                {/* Secondary Offset Background */}
                <path
                    d="M50 12L82 28V72L50 88L18 72V28L50 12Z"
                    fill="black"
                    fillOpacity="0.1"
                />

                {/* Stylized 'B' */}
                <text
                    x="42"
                    y="62"
                    fill="white"
                    fontSize="42"
                    fontWeight="900"
                    textAnchor="middle"
                    style={{ 
                        fontFamily: "'Outfit', 'Inter', sans-serif-black",
                        letterSpacing: "-1px"
                    }}
                >
                    B
                </text>

                {/* Stylized '12' */}
                <text
                    x="68"
                    y="52"
                    fill="white"
                    fontSize="22"
                    fontWeight="800"
                    textAnchor="middle"
                    style={{ 
                        fontFamily: "'Outfit', 'Inter', sans-serif-black",
                        opacity: 0.9
                    }}
                >
                    12
                </text>

                {/* Accent Line */}
                <rect 
                    x="25" 
                    y="68" 
                    width="40" 
                    height="4" 
                    rx="2" 
                    fill="white" 
                    fillOpacity="0.5" 
                />
            </svg>
        </motion.div>
    );
}
