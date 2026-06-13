import { useEffect } from 'react';

export function useModalLock(isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;

        // Orijinal taşma değerini kaydet
        const originalOverflow = document.body.style.overflow;

        // Sadece overflow'u gizle, position: fixed düzeni bozar
        document.body.style.overflow = 'hidden';

        // Önceki hatalı durumdan (hot-reload) kalmış olabilecek stilleri temizle
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);
}