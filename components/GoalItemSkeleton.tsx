import React from 'react';

export default function GoalItemSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 animate-pulse shadow-sm">
            {/* Drag Handle Placeholder */}
            <div className="w-2 h-8 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0"></div>

            {/* Checkbox Skeleton */}
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0"></div>

            <div className="flex-1 space-y-2 min-w-0">
                {/* Text Skeleton */}
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/5"></div>
                {/* Subtext/Badges Skeleton */}
                <div className="flex gap-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-10"></div>
                </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-2 ml-2 shrink-0">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
        </div>
    );
}
