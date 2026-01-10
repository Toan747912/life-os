"use client";
import React from "react";
import { LayoutDashboard } from "lucide-react";

interface HeaderProps {
    doneCount: number;
    totalCount: number;
}

export default function Header({ doneCount, totalCount }: HeaderProps) {
    return (
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <LayoutDashboard size={20} />
                <h3 className="font-bold">Danh sách công việc</h3>
            </div>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                {doneCount}/{totalCount} Task
            </span>
        </div>
    );
}
