import React, { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";

import { useSound } from "../hooks/useSound";
import toast from 'react-hot-toast';

export default function PomodoroModal({ task, onClose, onUpdateSession }) {
    // Logic: Use task.focus_span or default to 25
    const initialTime = (task.focus_span || 25) * 60;
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const { playSound } = useSound();

    // Ref to store the target end time to avoid re-renders
    const endTimeRef = React.useRef(null);

    useEffect(() => {
        let interval;
        if (isRunning) {
            // Calculate target time if not set (first run or resume)
            if (!endTimeRef.current) {
                endTimeRef.current = Date.now() + timeLeft * 1000;
            }

            interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.ceil((endTimeRef.current - now) / 1000);

                if (diff <= 0) {
                    setTimeLeft(0);
                    setIsRunning(false);
                    endTimeRef.current = null; // Reset ref
                    onUpdateSession(task.id, (task.completed_sessions || 0) + 1);
                    playSound('timer-finish');
                    toast.success("Hết giờ! Nghỉ ngơi chút nhé ☕", { duration: 5000, icon: '🎉' });
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);
        } else {
            // If paused, clear the ref so we calculate new end time on resume
            endTimeRef.current = null;
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, task.id, task.completed_sessions, onUpdateSession, playSound]); // timeLeft removed from dependency to avoid loop, handled by ref

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-white/10 relative animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>

                <h3 className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest mb-2 font-bold">Đang tập trung vào</h3>
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 line-clamp-2 leading-tight">{task.text}</h2>

                <div className={`text-8xl font-black mb-8 font-mono tracking-tighter tabular-nums transition-colors duration-500
                    ${isRunning ? 'text-indigo-600 dark:text-white' : 'text-slate-300 dark:text-slate-600'}
                `}>
                    {formatTime(timeLeft)}
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`p-6 rounded-full text-white transition-all transform hover:scale-110 shadow-xl ring-4 ring-offset-2 dark:ring-offset-slate-800 
                            ${isRunning
                                ? "bg-amber-500 ring-amber-200 hover:bg-amber-600"
                                : "bg-indigo-600 ring-indigo-200 hover:bg-indigo-700"
                            }`}
                    >
                        {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                    </button>

                    <button
                        onClick={() => {
                            setIsRunning(false);
                            setTimeLeft(initialTime); // Reset to initial dynamic time
                        }}
                        title="Đặt lại đồng hồ"
                        className="p-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:rotate-180 duration-500"
                    >
                        <RotateCcw size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}