import React from "react";
import { X } from "lucide-react";
import PomodoroTimer from "./PomodoroTimer";
import toast from 'react-hot-toast';
import { useConfetti } from "@/hooks/useConfetti";

export default function PomodoroModal({ task, onClose, onUpdateSession }) {
    const { triggerFireworks } = useConfetti();

    const handleComplete = () => {
        onUpdateSession(task.id, (task.completed_sessions || 0) + 1);
        toast.success("Hết giờ! Nghỉ ngơi chút nhé ☕", { duration: 5000, icon: '🎉' });
        triggerFireworks();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border border-white/10 relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors z-10">
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Đang tập trung vào</h3>
                    <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 line-clamp-2 leading-tight px-4">{task.text}</h2>
                </div>

                <PomodoroTimer
                    initialMinutes={task.focus_span || 25}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
}