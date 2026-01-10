
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

interface PomodoroTimerProps {
    initialMinutes: number;
    onComplete: () => void;
}

export default function PomodoroTimer({ initialMinutes, onComplete }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [progress, setProgress] = useState(100);
    const { playSound } = useSound();

    // Use ref to track completion to avoid double-calling onComplete due to strict mode or re-renders
    const isCompletedRef = useRef(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => {
                    const newTime = time - 1;
                    setProgress((newTime / (initialMinutes * 60)) * 100);
                    return newTime;
                });
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (!isCompletedRef.current) {
                isCompletedRef.current = true;
                onComplete();
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, initialMinutes, onComplete]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        playSound('click'); // Assuming 'click' sound exists, otherwise fallback or remove
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(initialMinutes * 60);
        setProgress(100);
        isCompletedRef.current = false;
        playSound('click');
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="flex flex-col items-center justify-center p-6">
            {/* Circular Progress & Timer Display */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Background Ring */}
                <div className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-slate-800"></div>

                {/* Active Ring (SVG for smooth progress) */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className="text-indigo-500 transition-all duration-1000 ease-linear"
                    />
                </svg>

                {/* Digital Timer */}
                <div className="text-6xl font-black text-slate-700 dark:text-slate-200 font-mono tracking-tighter">
                    {timeDisplay}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTimer}
                    className={`p-4 rounded-full transition-all shadow-lg hover:shadow-indigo-500/30 hover:scale-110 active:scale-95 flex items-center justify-center
                        ${isActive
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-indigo-600 text-white dark:bg-indigo-500'
                        }`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={resetTimer}
                    className="p-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all hover:rotate-180 duration-500"
                >
                    <RotateCcw size={24} />
                </button>
            </div>

            <p className="mt-6 text-sm text-slate-400 font-medium">
                {isActive ? "Hãy tập trung tuỵệt đối..." : "Sẵn sàng để bắt đầu?"}
            </p>
        </div>
    );
}
