"use client";
import React, { useMemo } from 'react';
import Image from 'next/image';
import { Session } from '@supabase/supabase-js';
import { useGamification } from '@/hooks/useGamification';
import { Goal } from '@/types';
import { Trophy, Zap, Calendar, Target, TrendingUp } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ProfileViewProps {
    session: Session | null;
    goals: Goal[];
}

export default function ProfileView({ session, goals }: ProfileViewProps) {
    const { profile } = useGamification(session);

    // Tính toán thống kê
    const totalDone = goals.filter(g => g.done).length;
    const totalFocusMinutes = goals.reduce((acc, g) => acc + ((g.completed_sessions || 0) * (g.focus_span || 25)), 0);
    const streak = profile?.streak || 0;

    // Tạo dữ liệu biểu đồ hoạt động (7 ngày qua)
    // Lưu ý: Do DB chưa có trường completed_at, ta tạm dùng target_date của task đã xong để ước lượng
    const activityData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const count = goals.filter(g => g.done && g.target_date === dateStr).length;
            const xp = count * 10; // Ước lượng 10 XP / task

            data.push({
                name: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
                xp: xp,
                tasks: count
            });
        }
        return data;
    }, [goals]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Trophy size={200} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-linear-to-tr from-violet-500 via-fuchsia-500 to-pink-500 p-1 shadow-2xl shadow-violet-500/30">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                <Image
                                    src={session?.user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                    alt="Avatar"
                                    width={128}
                                    height={128}
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-bold px-4 py-1 rounded-full border-4 border-white dark:border-slate-800 shadow-lg whitespace-nowrap">
                            Lvl {profile?.level || 1}
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                            {session?.user?.user_metadata?.full_name || "Guest User"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-2">
                            <Zap size={16} className="text-yellow-500" />
                            {profile?.xp || 0} Total XP
                        </p>
                        <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                                Pro Member
                            </span>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                                Online
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chuỗi ngày (Streak)</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{streak} ngày</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Task hoàn thành</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalDone}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Giờ tập trung</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{(totalFocusMinutes / 60).toFixed(1)}h</h3>
                    </div>
                </div>
            </div>

            {/* XP Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-indigo-500" />
                        Hoạt động 7 ngày qua (XP)
                    </h3>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                            />
                            <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" name="XP ước tính" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}