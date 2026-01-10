import React from 'react';
import { useMemo } from 'react';

interface HeatmapProps {
    data: { date: string; count: number }[];
}

export default function Heatmap({ data }: HeatmapProps) {
    const cellData = useMemo(() => {
        const today = new Date();
        const days = [];
        // Generate last 365 days
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = data.find(item => item.date === dateStr);
            days.push({
                date: dateStr,
                count: found ? found.count : 0,
                level: getLevel(found ? found.count : 0)
            });
        }
        return days;
    }, [data]);

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[700px]">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {cellData.map((day) => (
                        <div
                            key={day.date}
                            title={`${day.date}: ${day.count} tasks`}
                            className={`w-3 h-3 rounded-sm ${getColor(day.level)}`}
                        />
                    ))}
                </div>
                <div className="flex gap-2 items-center justify-end mt-2 text-xs text-slate-400">
                    <span>Less</span>
                    <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-900 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-400 dark:bg-indigo-700 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-indigo-800 dark:bg-indigo-400 rounded-sm"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}

function getLevel(count: number) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
}

const getColor = (level: number) => {
    switch (level) {
        case 0: return 'bg-slate-100 dark:bg-slate-800';
        case 1: return 'bg-indigo-200 dark:bg-indigo-900';
        case 2: return 'bg-indigo-400 dark:bg-indigo-700';
        case 3: return 'bg-indigo-600 dark:bg-indigo-500';
        case 4: return 'bg-indigo-800 dark:bg-indigo-400';
        default: return 'bg-slate-100';
    }
};
