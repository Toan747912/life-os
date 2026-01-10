"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/app/supabase";

interface CalendarViewProps {
    currentDate: Date;
    onSelectDate: (date: Date) => void;
    lastUpdate?: number; // timestamp to trigger refetch
}

export default function CalendarView({
    currentDate,
    onSelectDate,
    lastUpdate
}: CalendarViewProps) {
    const [displayDate, setDisplayDate] = useState(currentDate);
    const [monthData, setMonthData] = useState<Record<string, number>>({}); // dateStr -> taskCount

    // Generate days for the grid
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0, Sun=6

    // Helper to get YYYY-MM-DD in local time
    const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch month data to show dots
    useEffect(() => {
        const fetchMonthData = async () => {
            // Start of month
            const startStr = getLocalDateStr(new Date(year, month, 1));
            // End of month
            const endStr = getLocalDateStr(new Date(year, month + 1, 0));

            const { data } = await supabase
                .from('goals')
                .select('target_date, done')
                .gte('target_date', startStr)
                .lte('target_date', endStr);

            if (data) {
                const counts: Record<string, number> = {};
                data.forEach((item: { target_date: string }) => {
                    counts[item.target_date] = (counts[item.target_date] || 0) + 1;
                });
                setMonthData(counts);
            }
        };
        fetchMonthData();
    }, [year, month, lastUpdate]);

    const changeMonth = (delta: number) => {
        setDisplayDate(new Date(year, month + delta, 1));
    };

    const daysAndBlanks = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        daysAndBlanks.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        daysAndBlanks.push(i);
    }

    const isToday = (day: number) => {
        const d = new Date();
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const isSelected = (day: number) => {
        return currentDate.getDate() === day && currentDate.getMonth() === month && currentDate.getFullYear() === year;
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-700 dark:text-white capitalize">
                    {displayDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><ChevronLeft /></button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><ChevronRight /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {daysAndBlanks.map((day, idx) => (
                    <div key={idx} className="aspect-square">
                        {day ? (
                            <button
                                onClick={() => onSelectDate(new Date(year, month, day))}
                                className={`w-full h-full rounded-2xl flex flex-col items-center justify-center relative transition-all group
                        ${isSelected(day) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}
                        ${isToday(day) && !isSelected(day) ? 'border-2 border-indigo-500 text-indigo-600' : ''}
`}
                            >
                                <span className={`text-sm font-bold ${isSelected(day) ? 'text-white' : ''}`}>{day}</span>

                                {/* Dots for tasks */}
                                {(() => {
                                    // Better: Construct YYYY-MM-DD manually to match DB and MonthData keys
                                    const y = new Date(year, month, day).getFullYear();
                                    const m = String(new Date(year, month, day).getMonth() + 1).padStart(2, '0');
                                    const dStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
                                    const count = monthData[dStr] || 0;

                                    return count > 0 && (
                                        <div className="flex gap-0.5 mt-1">
                                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${isSelected(day) ? 'bg-white/50' : 'bg-indigo-400'}`} />
                                            ))}
                                            {count > 3 && <div className={`w-1 h-1 rounded-full ${isSelected(day) ? 'bg-white/50' : 'bg-indigo-400'}`}>+</div>}
                                        </div>
                                    )
                                })()}

                            </button>
                        ) : (
                            <div />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
