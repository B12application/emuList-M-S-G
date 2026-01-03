// src/frontend/components/MarqueeToast.tsx
import { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaTimes, FaEye, FaEyeSlash, FaBook, FaBookOpen, FaGamepad } from 'react-icons/fa';
import './MarqueeToast.css';

interface MarqueeToastProps {
    message: string;
    type: 'watched' | 'not-watched';
    mediaType?: 'movie' | 'series' | 'book' | 'game';
}

interface ToastState extends MarqueeToastProps {
    id: number;
    visible: boolean;
}

let toastId = 0;
let showToastFn: ((toast: MarqueeToastProps) => void) | null = null;

export const showMarqueeToast = (props: MarqueeToastProps) => {
    if (showToastFn) {
        showToastFn(props);
    }
};

export const MarqueeToastContainer = () => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const addToast = useCallback((props: MarqueeToastProps) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { ...props, id, visible: true }]);

        // Auto dismiss after 3.5 seconds
        setTimeout(() => {
            setToasts(prev =>
                prev.map(t => t.id === id ? { ...t, visible: false } : t)
            );
            // Remove from DOM after animation
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 500);
        }, 3500);
    }, []);

    useEffect(() => {
        showToastFn = addToast;
        return () => {
            showToastFn = null;
        };
    }, [addToast]);

    const getIcon = (type: string, mediaType?: string) => {
        if (type === 'watched') {
            switch (mediaType) {
                case 'book':
                    return <FaBookOpen className="marquee-toast-icon" />;
                case 'game':
                    return <FaGamepad className="marquee-toast-icon" />;
                default:
                    return <FaEye className="marquee-toast-icon" />;
            }
        } else {
            switch (mediaType) {
                case 'book':
                    return <FaBook className="marquee-toast-icon" />;
                case 'game':
                    return <FaGamepad className="marquee-toast-icon" />;
                default:
                    return <FaEyeSlash className="marquee-toast-icon" />;
            }
        }
    };

    return (
        <div className="marquee-toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`marquee-toast ${toast.type} ${toast.visible ? 'visible' : 'hidden'}`}
                >
                    <div className="marquee-toast-glow"></div>
                    <div className="marquee-toast-content">
                        <div className="marquee-toast-icon-wrapper">
                            {toast.type === 'watched' ? (
                                <FaCheck className="marquee-toast-check" />
                            ) : (
                                <FaTimes className="marquee-toast-x" />
                            )}
                        </div>
                        <div className="marquee-toast-text-container">
                            <div className="marquee-toast-text">
                                <span className="marquee-text-scroll">
                                    {getIcon(toast.type, toast.mediaType)}
                                    <span className="marquee-message">{toast.message}</span>
                                    <span className="marquee-divider">•</span>
                                    {getIcon(toast.type, toast.mediaType)}
                                    <span className="marquee-message">{toast.message}</span>
                                    <span className="marquee-divider">•</span>
                                    {getIcon(toast.type, toast.mediaType)}
                                    <span className="marquee-message">{toast.message}</span>
                                    <span className="marquee-divider">•</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="marquee-toast-border"></div>
                </div>
            ))}
        </div>
    );
};

export default MarqueeToastContainer;
