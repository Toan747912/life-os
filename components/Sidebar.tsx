import React from 'react';
import Image from 'next/image';
import { LogOut, Sun, Moon, Calendar, Trophy, Zap } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { useGamification } from '@/hooks/useGamification';

interface SidebarProps {
    session: Session | null;
    darkMode: boolean;
    toggleTheme: () => void;
    handleLogout: () => void;
    currentDate: Date;
    changeDate: (days: number) => void;
    progress: number;
    quote: string;
    view: 'tasks' | 'analytics' | 'calendar' | 'projects'; // Added projects
    setView: (view: 'tasks' | 'analytics' | 'calendar' | 'projects') => void;
}

const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
};

export default function Sidebar({
    session,
    darkMode,
    toggleTheme,
    handleLogout,
    currentDate,
    changeDate,
    progress,
    quote,
    view,
    setView
}: SidebarProps) {
    const { profile } = useGamification(session);

    // Gamification calculations
    const level = profile?.level || 1;
    const xp = profile?.xp || 0;
    const nextLevelXP = level * 100;
    const xpProgress = Math.min((xp / nextLevelXP) * 100, 100);

    return (
        <div className="space-y-6">
            {/* 1. Gamification & Profile Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-white/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={100} className="text-yellow-500" />
                </div>

                <div className="flex items-center space-x-4 mb-4 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-linear-to-tr from-yellow-400 to-orange-500 p-1 shadow-lg shadow-orange-200 dark:shadow-none relative">
                            <Image
                                src={session?.user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                alt="Avatar"
                                fill
                                sizes="64px"
                                className="rounded-full bg-white object-cover border-2 border-transparent"
                                priority
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm z-20">
                            Lvl {level}
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-lg">
                            {session?.user?.user_metadata?.full_name || "Guest User"}
                        </h2>
                        <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-md w-fit mt-1">
                            <Zap size={10} className="mr-1 fill-yellow-500" /> {profile ? "Streamer" : "Rookie"}
                        </div>
                    </div>
                </div>

                {/* XP BAR */}
                <div className="relative z-10 mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>XP: {xp}/{nextLevelXP}</span>
                        <span>{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Navigation Menu */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
                <button
                    onClick={() => setView('tasks')}
                    className={`flex-1 min-w-[45%] py-3 rounded-xl font-bold text-sm transition-all ${view === 'tasks' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Công việc
                </button>
                <button
                    onClick={() => setView('projects')}
                    className={`flex-1 min-w-[45%] py-3 rounded-xl font-bold text-sm transition-all ${view === 'projects' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Dự án
                </button>
                <button
                    onClick={() => setView('analytics')}
                    className={`flex-1 min-w-[45%] py-3 rounded-xl font-bold text-sm transition-all ${view === 'analytics' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Thống kê
                </button>
                <button
                    onClick={() => setView('calendar')}
                    className={`flex-1 min-w-[45%] py-3 rounded-xl font-bold text-sm transition-all ${view === 'calendar' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Lịch
                </button>
            </div>

            {/* 3. Date Navigation */}
            <div className="bg-indigo-600 dark:bg-indigo-900 p-6 rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar size={100} />
                </div>
                <p className="text-indigo-200 text-sm font-medium mb-1">
                    Hôm nay làm gì?
                </p>
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-4">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/20 rounded-lg transition">←</button>
                    <span className="font-bold text-lg capitalize">{formatDateDisplay(currentDate)}</span>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/20 rounded-lg transition">→</button>
                </div>

                {/* Daily Progress */}
                <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-white h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="text-right text-xs mt-1 text-indigo-200">{progress}% hoàn thành</div>
            </div>

            {/* 4. Quote */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/20 text-yellow-800 dark:text-yellow-200 italic text-sm text-center">
                &quot;{quote}&quot;
            </div>

            {/* 5. Footer (Theme & Logout) */}
            <div className="flex gap-4">
                <button
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-sm font-medium">{darkMode ? "Sáng" : "Tối"}</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 hover:bg-red-100 transition"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Thoát</span>
                </button>
            </div>
        </div>
    );
}
