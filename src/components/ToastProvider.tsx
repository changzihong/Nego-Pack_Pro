import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 w-full max-w-sm">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`relative overflow-hidden p-5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-4 ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                }`}
                        >
                            {/* Dynamic Glow Effect */}
                            <div className={`absolute top-0 right-0 w-20 h-20 blur-3xl -mr-10 -mt-10 opacity-20 ${toast.type === 'success' ? 'bg-green-500' :
                                    toast.type === 'error' ? 'bg-red-500' :
                                        'bg-blue-500'
                                }`} />

                            <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-green-500/20' :
                                    toast.type === 'error' ? 'bg-red-500/20' :
                                        'bg-blue-500/20'
                                }`}>
                                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                {toast.type === 'info' && <Info className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 pt-0.5">
                                <p className="text-sm font-bold leading-relaxed">{toast.message}</p>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Progress bar */}
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-green-500' :
                                        toast.type === 'error' ? 'bg-red-500' :
                                            'bg-blue-500'
                                    } opacity-30`}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
