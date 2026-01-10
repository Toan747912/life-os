"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types';

interface RecurringModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RecurringModal({ isOpen, onClose }: RecurringModalProps) {
    const { getRoutine, addToRoutine, removeFromRoutine } = useGoals();
    const [templates, setTemplates] = useState<Goal[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);

    const loadTemplates = async () => {
        setLoading(true);
        const data = await getRoutine();
        setTemplates(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            // We can define loadTemplates inside or assume getRoutine is stable (it comes from hook)
            // Best to just call it directly.
            const fetch = async () => {
                setLoading(true);
                const data = await getRoutine();
                setTemplates(data);
                setLoading(false);
            };
            fetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // We can omit getRoutine if we trust it's stable, or add it. useGoals returns new object every render likely.
    // Ideally useGoals should use useCallback for its functions. For now, we will suppress or ignore if it causes loops.
    // Better: define fetch function inside effect.

    const handleAdd = async () => {
        if (!text.trim()) return;

        // Check duplicate (case-insensitive)
        const exists = templates.some(t => t.text?.toLowerCase() === text.trim().toLowerCase());
        if (exists) {
            alert("Routine này đã có trong danh sách rồi!"); // Or use Toast if available in this component (it is not imported yet, but we can import it)
            return;
        }

        await addToRoutine(text.trim(), 'work'); // Default to work for now
        setText("");
        loadTemplates();
    };

    const handleDelete = async (id: number) => {
        await removeFromRoutine(id);
        loadTemplates(); // Reload list
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý Daily Routine 🔁</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Nhập task lặp lại hằng ngày..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Đang tải...</div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-slate-400 text-sm">Chưa có routine nào.</p>
                            </div>
                        ) : (
                            templates.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{t.text}</span>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 text-center">
                            Các task trong danh sách này sẽ có thể được thêm nhanh vào lịch trình hằng ngày của bạn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
