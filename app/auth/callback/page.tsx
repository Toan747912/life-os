"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../supabase";
import { Suspense } from "react";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    console.error("Lỗi xác thực:", error);
                }
                // Redirect về trang chủ sau khi xử lý xong (thành công hoặc thất bại)
                router.push("/");
                router.refresh(); // Refresh để cập nhật state session ở trang chủ
            });
        } else {
            // Không có code thì về trang chủ luôn
            router.push("/");
        }
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50" suppressHydrationWarning>
            <div className="text-center">
                <h1 className="text-xl font-bold text-slate-700">Đang xử lý đăng nhập...</h1>
                <p className="text-slate-400 mt-2">Vui lòng đợi trong giây lát 🐙</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
