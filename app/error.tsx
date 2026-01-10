'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-900/30">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertTriangle size={32} />
                </div>

                <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Hệ thống gặp sự cố không mong muốn. Đừng lo, dữ liệu của bạn vẫn an toàn.
                </p>

                <button
                    onClick={reset}
                    className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
                >
                    <RefreshCcw size={18} />
                    Thử lại
                </button>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-950 rounded-lg text-left overflow-auto max-h-40 text-xs font-mono text-red-500">
                        {error.message}
                    </div>
                )}
            </div>
        </div>
    );
}
