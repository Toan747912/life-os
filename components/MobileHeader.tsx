import React from 'react';
import Image from 'next/image';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { useGamification } from '@/hooks/useGamification';

interface MobileHeaderProps {
    session: Session | null;
    darkMode: boolean;
    toggleTheme: () => void;
}

export default function MobileHeader({ session, darkMode, toggleTheme }: MobileHeaderProps) {
    const { profile } = useGamification(session);
    const level = profile?.level || 1;
    const xp = profile?.xp || 0;
    const nextLevelXP = level * 100;
    const progress = Math.min((xp / nextLevelXP) * 100, 100);

    return (
        <div className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between">

                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-violet-500 to-fuchsia-500 p-0.5">
                            <Image
                                src={session?.user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                alt="Avatar"
                                width={40}
                                height={40}
                                className="rounded-full bg-white dark:bg-slate-800 object-cover border-2 border-transparent"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-800">
                            Lvl {level}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                            {session?.user?.user_metadata?.full_name?.split(' ')[0] || "Guest"}
                        </h1>
                        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div
                                className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                        <Sparkles size={12} />
                        <span>{profile?.xp || 0} XP</span>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
