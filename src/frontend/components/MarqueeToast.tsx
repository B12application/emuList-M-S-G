// src/frontend/components/MarqueeToast.tsx
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FaCheck, FaTimes, FaEye, FaEyeSlash,
    FaBook, FaBookOpen, FaGamepad, FaTrash,
    FaFilm, FaTv, FaHeart, FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';

export type ToastVariant =
    | 'watched'
    | 'not-watched'
    | 'deleted'
    | 'success'
    | 'error'
    | 'info'
    | 'favorite';

export interface MarqueeToastProps {
    message: string;
    type: ToastVariant;
    mediaType?: 'movie' | 'series' | 'book' | 'game';
    duration?: number;
}

interface ToastState extends MarqueeToastProps {
    id: number;
}

let toastId = 0;
let showToastFn: ((toast: MarqueeToastProps) => void) | null = null;

export const showMarqueeToast = (props: MarqueeToastProps) => {
    if (showToastFn) showToastFn(props);
};

/* ─── Config per type — Palette: yeşil · kırmızı · sarı · kahverengi · gri ─── */
const CONFIGS: Record<ToastVariant, {
    gradient: string;
    border: string;
    glow: string;
    iconBg: string;
    icon: React.ReactNode;
    progressColor: string;
    emoji: string;
}> = {
    watched: {
        gradient: 'linear-gradient(135deg, rgba(220,252,231,1) 0%, rgba(248,255,248,1) 100%)',
        border: 'rgba(22,163,74,0.35)',
        glow: 'rgba(22,163,74,0.20)',
        iconBg: 'rgba(22,163,74,0.12)',
        icon: <FaEye size={18} color="#16a34a" />,
        progressColor: '#16a34a',
        emoji: '✅',
    },
    'not-watched': {
        gradient: 'linear-gradient(135deg, rgba(254,226,226,1) 0%, rgba(255,248,248,1) 100%)',
        border: 'rgba(185,28,28,0.30)',
        glow: 'rgba(185,28,28,0.15)',
        iconBg: 'rgba(185,28,28,0.10)',
        icon: <FaEyeSlash size={18} color="#b91c1c" />,
        progressColor: '#dc2626',
        emoji: '👁️‍🗨️',
    },
    deleted: {
        gradient: 'linear-gradient(135deg, rgba(254,202,202,1) 0%, rgba(255,245,245,1) 100%)',
        border: 'rgba(153,27,27,0.35)',
        glow: 'rgba(153,27,27,0.18)',
        iconBg: 'rgba(153,27,27,0.10)',
        icon: <FaTrash size={16} color="#991b1b" />,
        progressColor: '#b91c1c',
        emoji: '🗑️',
    },
    success: {
        gradient: 'linear-gradient(135deg, rgba(220,252,231,1) 0%, rgba(247,255,247,1) 100%)',
        border: 'rgba(22,163,74,0.35)',
        glow: 'rgba(22,163,74,0.20)',
        iconBg: 'rgba(22,163,74,0.12)',
        icon: <FaCheck size={18} color="#15803d" />,
        progressColor: '#16a34a',
        emoji: '🎉',
    },
    error: {
        gradient: 'linear-gradient(135deg, rgba(254,202,202,1) 0%, rgba(255,245,245,1) 100%)',
        border: 'rgba(185,28,28,0.35)',
        glow: 'rgba(185,28,28,0.18)',
        iconBg: 'rgba(185,28,28,0.10)',
        icon: <FaExclamationTriangle size={16} color="#991b1b" />,
        progressColor: '#b91c1c',
        emoji: '⚠️',
    },
    info: {
        gradient: 'linear-gradient(135deg, rgba(254,243,199,1) 0%, rgba(255,252,240,1) 100%)',
        border: 'rgba(146,64,14,0.30)',
        glow: 'rgba(146,64,14,0.15)',
        iconBg: 'rgba(146,64,14,0.10)',
        icon: <FaInfoCircle size={18} color="#92400e" />,
        progressColor: '#b45309',
        emoji: 'ℹ️',
    },
    favorite: {
        gradient: 'linear-gradient(135deg, rgba(220,252,231,1) 0%, rgba(247,255,247,1) 100%)',
        border: 'rgba(22,163,74,0.35)',
        glow: 'rgba(22,163,74,0.18)',
        iconBg: 'rgba(22,163,74,0.12)',
        icon: <FaHeart size={16} color="#15803d" />,
        progressColor: '#16a34a',
        emoji: '💚',
    },
};

function getMediaIcon(mediaType?: string, variant?: ToastVariant) {
    if (variant === 'deleted') return <FaTrash size={10} />;
    switch (mediaType) {
        case 'movie': return <FaFilm size={10} />;
        case 'series': return <FaTv size={10} />;
        case 'book': return variant === 'watched' ? <FaBookOpen size={10} /> : <FaBook size={10} />;
        case 'game': return <FaGamepad size={10} />;
        default: return null;
    }
}

/* ─── Single Toast Card ─── */
function ToastCard({ toast, onDone }: { toast: ToastState; onDone: (id: number) => void }) {
    const cfg = CONFIGS[toast.type] || CONFIGS.success;
    const duration = toast.duration ?? 3500;

    useEffect(() => {
        const t = setTimeout(() => onDone(toast.id), duration);
        return () => clearTimeout(t);
    }, [toast.id, duration, onDone]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.85, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 300,
                maxWidth: 420,
                borderRadius: 20,
                overflow: 'hidden',
                background: cfg.gradient,
                border: `1.5px solid ${cfg.border}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: `0 8px 40px ${cfg.glow}, 0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
                cursor: 'pointer',
                userSelect: 'none',
            }}
            onClick={() => onDone(toast.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* ── Shimmer overlay ── */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.15 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />

            {/* ── Content Row ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', position: 'relative', zIndex: 2 }}>

                {/* Icon bubble */}
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
                    style={{
                        flexShrink: 0,
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: cfg.iconBg,
                        border: `1px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {cfg.icon}
                </motion.div>

                {/* Text block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <motion.div
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18 }}
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'rgba(30,30,30,0.92)',
                            letterSpacing: '0.2px',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {cfg.emoji} {toast.message}
                    </motion.div>
                    {toast.mediaType && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.28 }}
                            style={{
                                marginTop: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                color: cfg.progressColor,
                                opacity: 0.8,
                            }}
                        >
                            {getMediaIcon(toast.mediaType, toast.type)}
                            <span style={{ textTransform: 'capitalize' }}>{toast.mediaType}</span>
                        </motion.div>
                    )}
                </div>

                {/* Close X */}
                <motion.div
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    style={{
                        flexShrink: 0,
                        color: 'rgba(50,50,50,0.45)',
                        fontSize: 12,
                        lineHeight: 1,
                        padding: 4,
                    }}
                >
                    <FaTimes />
                </motion.div>
            </div>

            {/* ── Progress bar ── */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                style={{
                    height: 3,
                    background: cfg.progressColor,
                    transformOrigin: 'left center',
                    borderRadius: '0 0 20px 20px',
                    opacity: 0.8,
                    boxShadow: `0 0 8px ${cfg.progressColor}`,
                }}
            />
        </motion.div>
    );
}

/* ─── Container ─── */
export const MarqueeToastContainer = () => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const addToast = useCallback((props: MarqueeToastProps) => {
        const id = ++toastId;
        // Replace older identical-message toasts to avoid pile-up
        setToasts(prev => {
            const filtered = prev.filter(t => t.message !== props.message);
            return [...filtered, { ...props, id }];
        });
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        showToastFn = addToast;
        return () => { showToastFn = null; };
    }, [addToast]);

    return (
        <div style={{
            position: 'fixed',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
        }}>
            <AnimatePresence mode="sync">
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: 'auto' }}>
                        <ToastCard toast={t} onDone={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default MarqueeToastContainer;
