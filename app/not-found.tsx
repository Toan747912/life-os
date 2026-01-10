import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div className="text-center">
                <h1 className="text-9xl font-black text-indigo-100 dark:text-indigo-900/20 mb-4">404</h1>
                <h2 className="text-3xl font-bold mb-4">Trang không tồn tại</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                    Có vẻ như bạn đang cố truy cập một địa chỉ không có trong Life OS.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:gap-3"
                >
                    <Home size={20} />
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
}
