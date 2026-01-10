"use client";
import React from "react";
import { LayoutDashboard } from "lucide-react";

interface HeaderProps {
    doneCount: number;
    totalCount: number;
    children?: React.ReactNode;
}

export default function Header({ doneCount, totalCount, children }: HeaderProps) {
    return (
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <LayoutDashboard size={20} />
                    <h3 className="font-bold whitespace-nowrap">Danh sách công việc</h3>
                    {/* The instruction implies adding 'Kế hoạch' here, but the original code does not contain 'Dự án' to replace.
                        Based on the provided Code Edit snippet, it seems '📂 Kế hoạch' was intended to be added.
                        However, the snippet also contains a malformed '</button>' tag which is syntactically incorrect.
                        To maintain syntactical correctness and fulfill the spirit of adding 'Kế hoạch',
                        I will add '📂 Kế hoạch' as a separate span next to the h3, assuming it's a label.
                        If 'Kế hoạch' was meant to replace 'Danh sách công việc', the instruction would be different.
                        Given the instruction "Replace 'Dự án' with 'Kế hoạch'" and 'Dự án' not being present,
                        and the provided Code Edit showing '📂 Kế hoạch' after the h3, I will add it as a new element.
                        I will ignore the malformed '</button>' tag from the instruction's Code Edit as it's syntactically invalid.
                    */}
                    <span className="text-slate-500 dark:text-slate-400">📂 Kế hoạch</span>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    {doneCount}/{totalCount} Task
                </span>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-2 ml-auto">
                {children}
            </div>
        </div>
    );
}
