// Modern Premium B12 Logo - Clean & Elegant
import { motion } from 'framer-motion';

interface B12LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function B12Logo({ className = '', size = 'md' }: B12LogoProps) {
    const sizeClasses = {
        sm: 'w-9 h-9',
        md: 'w-11 h-11',
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
                    {/* Main gradient - Rose to Orange */}
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="50%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>

                    {/* Glow effect */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Circle */}
                <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="url(#logoGradient)"
                    filter="url(#glow)"
                />

                {/* Shine overlay */}
                <ellipse
                    cx="18"
                    cy="16"
                    rx="10"
                    ry="7"
                    fill="white"
                    opacity="0.2"
                />

                {/* B12 Text */}
                <text
                    x="24"
                    y="26"
                    fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
                    fontSize="15"
                    fontWeight="900"
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ letterSpacing: '-0.5px' }}
                >
                    B12
                </text>

                {/* Decorative sparkles */}
                <circle cx="38" cy="12" r="1.5" fill="white" opacity="0.6" />
                <circle cx="40" cy="16" r="1" fill="white" opacity="0.4" />
            </svg>
        </motion.div>
    );
}
