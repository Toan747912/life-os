import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Goal } from "../types";
import { Clock, Target, Activity } from "lucide-react";
import Heatmap from "./Heatmap";

interface AnalyticsProps {
    goals: Goal[];
}

export default function Analytics({ goals }: AnalyticsProps) {
    // 0. Heatmap Data
    const heatmapData = useMemo(() => {
        const counts: Record<string, number> = {};
        goals.forEach(g => {
            if (g.done && g.target_date) {
                counts[g.target_date] = (counts[g.target_date] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }, [goals]);

    // 1. Data for Pie Chart (Status)
    const doneCount = goals.filter((g) => g.done).length;
    const pendingCount = goals.length - doneCount;
    const pieData = [
        { name: "Đã xong", value: doneCount },
        { name: "Chưa xong", value: pendingCount },
    ];
    const COLORS = ["#10B981", "#E2E8F0"]; // Tailwind green-500, slate-200

    // 2. Data for Bar Chart (Focus Time per Category)
    // Group by category
    const categoryData: Record<string, { name: string; minutes: number }> = {};

    goals.forEach((g) => {
        const cat = g.category || "other";
        const minutes = (g.completed_sessions || 0) * (g.focus_span || 25);
        if (!categoryData[cat]) {
            categoryData[cat] = { name: cat, minutes: 0 };
        }
        categoryData[cat].minutes += minutes;
    });

    const barData = Object.values(categoryData);

    // 3. Summary Stats
    const totalMinutes = goals.reduce(
        (acc, g) => acc + (g.completed_sessions || 0) * (g.focus_span || 25),
        0
    );
    const completionRate =
        goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Heatmap Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="text-indigo-500" size={20} />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Biểu đồ năng suất (Heatmap)</h3>
                </div>
                <Heatmap data={heatmapData} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Stat Card 1 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full text-green-600 dark:text-green-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Hoàn thành</p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{completionRate}%</h4>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Thời gian Focus</p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{totalMinutes}p</h4>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Pie */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Tiến độ công việc</h3>
                    {goals.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                            Chưa có dữ liệu để vẽ bánh 🍰
                        </div>
                    )}
                </div>

                {/* Chart 2: Bar */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Thời gian tập trung (phút)</h3>
                    {barData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                            <p>Chưa có dữ liệu tập trung</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
