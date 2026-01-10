"use client";
import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { CheckSquare, BrainCircuit } from "lucide-react";
import { SortableGoalItem } from "./SortableGoalItem";
import { Goal } from "../types";

interface TaskListProps {
    loading: boolean;
    goals: Goal[];
    handleAddTask: (type?: string) => void;
    toggleDone: (id: number, status: boolean) => void;
    handleUpdateField: (id: number, field: keyof Goal, value: string | number) => void;
    handleDeleteTask: (id: number) => void;
    setFocusTask: (goal: Goal) => void;
    handleRequestStrictMode: (id: number) => void;
    onReorder: (newGoals: Goal[]) => void;
}

import GoalItemSkeleton from "./GoalItemSkeleton";

export default function TaskList({
    loading,
    goals,
    handleAddTask,
    toggleDone,
    handleUpdateField,
    handleDeleteTask,
    setFocusTask,
    handleRequestStrictMode,
    onReorder
}: TaskListProps) {

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = goals.findIndex((g) => g.id === active.id);
            const newIndex = goals.findIndex((g) => g.id === over.id);
            const newGoals = arrayMove(goals, oldIndex, newIndex);
            onReorder(newGoals);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <GoalItemSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 min-h-[50vh]">
            {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="text-4xl mb-4">😴</div>
                    <p>Chưa có kế hoạch nào cho ngày này.</p>
                    <button
                        onClick={() => handleAddTask('daily')}
                        className="mt-4 text-indigo-500 font-bold hover:underline"
                    >
                        Thêm ngay +
                    </button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={goals.map(g => g.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {goals.map((goal, index) => (
                            <SortableGoalItem
                                key={goal.id}
                                goal={goal}
                                index={index}
                                // Props passed to GoalItem
                                onToggle={toggleDone}
                                onChange={(id: number, val: string) => handleUpdateField(id, 'text', val)}
                                onSave={(id: number, val: string) => handleUpdateField(id, 'text', val)}
                                onDelete={handleDeleteTask}
                                onUpdateField={handleUpdateField}
                                onFocus={setFocusTask}
                                onRequestStrictMode={handleRequestStrictMode}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}

            {/* Nút Thêm Mới */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                    onClick={() => handleAddTask('daily')}
                    className="py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full group-hover:scale-110 transition-transform">
                        <CheckSquare size={20} />
                    </div>
                    <span className="text-sm">Thêm việc vặt</span>
                </button>

                <button
                    onClick={() => handleAddTask('study')}
                    className="py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-900/50 rounded-2xl text-indigo-500 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full group-hover:scale-110 transition-transform">
                        <BrainCircuit size={20} />
                    </div>
                    <span className="text-sm">Thêm phiên tập trung</span>
                </button>
            </div>
        </div>
    );
}
