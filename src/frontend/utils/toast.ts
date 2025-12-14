// src/frontend/utils/toast.ts
import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
    toast.success(message, {
        duration: 3000,
        position: 'bottom-right',
        style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: '500',
        },
    });
};

export const showError = (message: string) => {
    toast.error(message, {
        duration: 4000,
        position: 'bottom-right',
        style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '500',
        },
    });
};

export const showInfo = (message: string) => {
    toast(message, {
        duration: 3000,
        position: 'bottom-right',
        icon: 'ℹ️',
        style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: '500',
        },
    });
};

export const showLoading = (message: string) => {
    return toast.loading(message, {
        position: 'bottom-right',
    });
};

export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
};
