import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons: Record<ToastType, React.FC<{ size: number; className: string }>> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
};

const colors: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
};

const iconColors: Record<ToastType, string> = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((message: string) => showToast('success', message), [showToast]);
    const error = useCallback((message: string) => showToast('error', message), [showToast]);
    const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
    const info = useCallback((message: string) => showToast('info', message), [showToast]);

    return React.createElement(
        ToastContext.Provider,
        { value: { showToast, success, error, warning, info } },
        children,
        React.createElement(ToastContainer, { toasts, removeToast })
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return React.createElement(
        'div',
        {
            className: 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm'
        },
        toasts.map(toast =>
            React.createElement(ToastItem, { key: toast.id, toast, onClose: () => removeToast(toast.id) })
        )
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const Icon = icons[toast.type];

    return React.createElement(
        'div',
        {
            className: `flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right duration-300 ${colors[toast.type]}`
        },
        React.createElement(Icon, { size: 20, className: iconColors[toast.type] }),
        React.createElement(
            'p',
            { className: 'flex-1 text-sm font-medium' },
            toast.message
        ),
        React.createElement(
            'button',
            {
                onClick: onClose,
                className: 'p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors'
            },
            React.createElement(X, { size: 14 })
        )
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
