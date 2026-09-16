import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

export default function Portal({ children }: PortalProps) {
    const [mounted, setMounted] = useState(() => typeof document !== 'undefined');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(children, document.body);
}