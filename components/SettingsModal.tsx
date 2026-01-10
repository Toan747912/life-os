"use client";
import React, { useState, useEffect } from "react";
import { X, Settings, Moon, Sun, Volume2, User, LogOut, CheckCircle2, Sparkles, Plus, Trash2 } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { useTasks } from '@/hooks/useTasks';
import { Goal } from '@/types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    toggleTheme: () => void;
    isDarkMode: boolean;
    currentUser: { email?: string } | null;
    handleLogout: () => void;
}

const SECTIONS = [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'routines', label: 'Thói quen (Routine)', icon: CheckCircle2 },
    { id: 'appearance', label: 'Giao diện & Hiển thị', icon: Sparkles },
    { id: 'account', label: 'Tài khoản', icon: User },
];

export default function SettingsModal({ isOpen, onClose, toggleTheme, isDarkMode, currentUser, handleLogout }: SettingsModalProps) {
    const [activeSection, setActiveSection] = useState('general');

    const { playSound } = useSound();
    // Logic migrated from RecurringModal
    const { getRoutine, addToRoutine, removeFromRoutine } = useTasks(undefined, () => playSound('delete'));
    const [templates, setTemplates] = useState<Goal[]>([]);
    const [routineText, setRoutineText] = useState("");
    const [loadingRoutine, setLoadingRoutine] = useState(false);

    // Manual refresh function
    const refreshTemplates = React.useCallback(async () => {
        setLoadingRoutine(true);
        const data = await getRoutine();
        setTemplates(data);
        setLoadingRoutine(false);
    }, [getRoutine]);

    useEffect(() => {
        if (isOpen && activeSection === 'routines') {
            // eslint-disable-next-line
            refreshTemplates();
        }
    }, [isOpen, activeSection, refreshTemplates]);

    const handleAddRoutine = async () => {
        if (!routineText.trim()) return;
        const exists = templates.some(t => t.text?.toLowerCase() === routineText.trim().toLowerCase());
        if (exists) {
            alert("Routine này đã có trong danh sách rồi!");
            return;
        }
        await addToRoutine(routineText.trim(), 'work');
        setRoutineText("");
        refreshTemplates();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* SIDEBAR */}
                <div className="w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
                    <div className="flex items-center gap-2 px-2 mb-6">
                        <Settings className="text-slate-400" size={20} />
                        <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Cài đặt</span>
                    </div>

                    <div className="space-y-1 flex-1">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                    ${isActive
                                            ? "bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-2 text-xs text-slate-400 font-medium">
                        Version 2.0.1 (Beta)
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                            {SECTIONS.find(s => s.id === activeSection)?.label}
                        </h2>

                        {/* SECTION: GENERAL */}
                        {activeSection === 'general' && (
                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                                <Volume2 size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Âm thanh</h4>
                                                <p className="text-sm text-slate-500">Phát âm thanh khi hoàn thành task</p>
                                            </div>
                                        </div>
                                        <div className="relative inline-block w-11 h-6 transition duration-200 ease-in-out bg-gray-200 dark:bg-slate-700 rounded-full cursor-pointer">
                                            <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition translate-x-5 shadow-sm"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION: ROUTINES (Migrated from RecurringModal) */}
                        {activeSection === 'routines' && (
                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={routineText}
                                        onChange={(e) => setRoutineText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRoutine()}
                                        placeholder="Nhập task lặp lại hằng ngày..."
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200"
                                    />
                                    <button
                                        onClick={handleAddRoutine}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {loadingRoutine ? (
                                        <div className="text-center py-8 text-slate-400">Đang tải routine...</div>
                                    ) : templates.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            <p className="text-slate-400">Chưa có routine nào.</p>
                                        </div>
                                    ) : (
                                        templates.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{t.text}</span>
                                                <button
                                                    onClick={() => removeFromRoutine(t.id).then(refreshTemplates)}
                                                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SECTION: APPEARANCE */}
                        {activeSection === 'appearance' && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-indigo-300 transition-all" onClick={toggleTheme}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Giao diện (Theme)</h4>
                                                <p className="text-sm text-slate-500">{isDarkMode ? 'Đang dùng: Tối (Dark Mode)' : 'Đang dùng: Sáng (Light Mode)'}</p>
                                            </div>
                                        </div>
                                        <button className={`w-12 h-6 rounded-full p-1 transition-all ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isDarkMode ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION: ACCOUNT */}
                        {activeSection === 'account' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center">
                                        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mx-auto flex items-center justify-center mb-4 text-4xl">
                                            👾
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                            {currentUser?.email?.split('@')[0] || "Guest User"}
                                        </h3>
                                        <p className="text-slate-500">{currentUser?.email || "guest@lifeos.app"}</p>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-xs font-bold">PRO ACCOUNT</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                                >
                                    <LogOut size={20} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
