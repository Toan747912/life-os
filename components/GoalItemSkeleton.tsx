import React from 'react';

export default function GoalItemSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 animate-pulse">
            <div className="flex items-center gap-3 w-full">
                {/* Checkbox Skeleton */}
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0"></div>

                <div className="flex-1 space-y-2">
                    {/* Text Skeleton */}
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    {/* Subtext Skeleton */}
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-2 ml-4">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
        </div>
    );
}
