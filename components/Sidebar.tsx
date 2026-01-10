import React from 'react';
import Image from 'next/image';
import { LogOut, Sun, Moon, Calendar, Trophy, Zap, CheckSquare, Layers, PieChart } from 'lucide-react';
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
        <div className="hidden md:block space-y-6 h-full sticky top-8">
            {/* 1. Gamification & Profile Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-white/50 dark:border-slate-700/50 relative overflow-hidden group transition-all hover:scale-[1.02]">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                    <Trophy size={120} className="text-fuchsia-500 rotate-12" />
                </div>

                <div className="flex items-center space-x-4 mb-5 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-linear-to-tr from-violet-500 via-fuchsia-500 to-pink-500 p-[2px] shadow-lg shadow-violet-500/30">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                <Image
                                    src={session?.user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border-2 border-white dark:border-slate-800 shadow-md z-20 flex items-center gap-1">
                            <span>Lvl</span>
                            <span className="text-yellow-400 text-xs">{level}</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">
                            {session?.user?.user_metadata?.full_name || "Guest User"}
                        </h2>
                        <div className="flex items-center text-xs font-bold bg-linear-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full w-fit mt-1.5">
                            <Zap size={10} className="mr-1 fill-violet-500" />
                            {profile ? "Focus Master" : "Novice"}
                        </div>
                    </div>
                </div>

                {/* XP BAR */}
                <div className="relative z-10 mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 px-1">
                        <span>XP: <span className="text-slate-600 dark:text-slate-300">{xp}</span>/{nextLevelXP}</span>
                        <span>{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all duration-700 ease-out"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Navigation Menu */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-3xl shadow-sm border border-white/50 dark:border-slate-700/50 flex flex-col gap-1">
                {([
                    { id: 'tasks', label: 'Công việc', icon: CheckSquare },
                    { id: 'projects', label: 'Dự án', icon: Layers },
                    { id: 'analytics', label: 'Thống kê', icon: PieChart },
                    { id: 'calendar', label: 'Lịch biểu', icon: Calendar }
                ] as const).map((item) => (
                    <button
                        key={item.id}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => setView(item.id as any)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group relative overflow-hidden
                            ${view === item.id
                                ? 'bg-linear-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                                : 'text-slate-500 hover:bg-white hover:shadow-md dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                    >
                        {/* Hover effect background */}
                        <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${view === item.id ? 'block' : 'hidden'}`} />

                        {/* Icon mapped manually or passed */}
                        {item.id === 'tasks' && <CheckSquare size={20} className={view === item.id ? "text-white" : "text-slate-400 group-hover:text-violet-500"} />}
                        {item.id === 'projects' && <Layers size={20} className={view === item.id ? "text-white" : "text-slate-400 group-hover:text-violet-500"} />}
                        {item.id === 'analytics' && <PieChart size={20} className={view === item.id ? "text-white" : "text-slate-400 group-hover:text-violet-500"} />}
                        {item.id === 'calendar' && <Calendar size={20} className={view === item.id ? "text-white" : "text-slate-400 group-hover:text-violet-500"} />}

                        <span>{item.label}</span>

                        {view === item.id && <div className="absolute right-4 w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </button>
                ))}
            </div>

            {/* 3. Date Navigation */}
            <div className="bg-linear-to-br from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-800 p-6 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none text-white relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500 rotate-12 group-hover:rotate-0">
                    <Calendar size={120} />
                </div>

                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                    Daily Progress
                </p>

                <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3 mb-5 border border-white/10">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition active:scale-90">←</button>
                    <span className="font-bold text-lg capitalize drop-shadow-md">{formatDateDisplay(currentDate)}</span>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/20 rounded-xl transition active:scale-90">→</button>
                </div>

                {/* Daily Progress */}
                <div className="flex justify-between items-end mb-1">
                    <span className="text-3xl font-black">{progress}%</span>
                    <span className="text-xs text-indigo-200 font-medium mb-1.5">Completed</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                    <div
                        className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* 4. Quote */}
            <div className="bg-amber-50/80 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-amber-900/80 dark:text-amber-100/60 italic text-sm text-center relative">
                <span className="absolute top-2 left-3 text-4xl text-amber-200 dark:text-amber-800/30 font-serif leading-none">&ldquo;</span>
                <span className="relative z-10">{quote}</span>
            </div>

            {/* 5. Footer (Theme & Logout) */}
            <div className="flex gap-3 mt-auto">
                <button
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition shadow-sm"
                >
                    {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600" />}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex-none w-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 border border-red-100 dark:border-transparent hover:bg-red-100 hover:scale-105 transition"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
}
