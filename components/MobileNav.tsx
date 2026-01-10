import React from 'react';
import { CheckSquare, Calendar, PieChart, Layers, User } from 'lucide-react';

interface MobileNavProps {
    view: 'tasks' | 'analytics' | 'calendar' | 'projects' | 'profile';
    setView: (view: 'tasks' | 'analytics' | 'calendar' | 'projects' | 'profile') => void;
}

export default function MobileNav({ view, setView }: MobileNavProps) {
    const navItems = [
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'projects', label: 'Projects', icon: Layers },
        { id: 'analytics', label: 'Stats', icon: PieChart },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'profile', label: 'Profile', icon: User },
    ] as const;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
            <div className="flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = view === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative
                                ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                            `}
                        >
                            {isActive && (
                                <span className="absolute -top-2 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 active:scale-90" />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
