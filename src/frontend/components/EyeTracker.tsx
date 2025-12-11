import { useEffect, useState, useRef } from 'react';

interface EyeProps {
    pupilPosition: { x: number; y: number };
}

function Eye({ pupilPosition }: EyeProps) {
    return (
        <div
            className="relative w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-md"
            style={{
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Eye white */}
            <div className="absolute inset-0 bg-white dark:bg-gray-100" />

            {/* Iris */}
            <div
                className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 dark:from-rose-500 dark:to-rose-700 shadow-inner"
                style={{
                    transform: `translate(calc(-50% + ${pupilPosition.x}px), calc(-50% + ${pupilPosition.y}px))`,
                    transition: 'transform 0.1s ease-out',
                }}
            >
                {/* Pupil */}
                <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-black shadow-lg"
                    style={{
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {/* Light reflection */}
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white opacity-80" />
                </div>

                {/* Iris detail ring */}
                <div className="absolute inset-0 rounded-full border-2 border-rose-800/30 dark:border-rose-900/40" />
            </div>

            {/* Subtle shine effect */}
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40 blur-sm" />
        </div>
    );
}

export default function EyeTracker() {
    const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const distance = Math.min(6, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 20);

            const pupilX = Math.cos(angle) * distance;
            const pupilY = Math.sin(angle) * distance;

            setPupilPosition({ x: pupilX, y: pupilY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="flex items-center gap-2 hover:scale-110 transition-transform duration-300"
        >
            <Eye pupilPosition={pupilPosition} />
            <Eye pupilPosition={pupilPosition} />
        </div>
    );
}
