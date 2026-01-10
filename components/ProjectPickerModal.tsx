import React, { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Goal } from '@/types';
import { X, ArrowRight, Folder } from 'lucide-react';

interface ProjectPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onTaskMoved: () => void;
}

export default function ProjectPickerModal({ isOpen, onClose, currentDate, onTaskMoved }: ProjectPickerModalProps) {
    const { moveTaskToToday } = useTasks();
    const { fetchProjects, fetchProjectTasks } = useProjects();
    const [projects, setProjects] = useState<Goal[]>([]);
    const [selectedProject, setSelectedProject] = useState<Goal | null>(null);
    const [tasks, setTasks] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);



    useEffect(() => {
        if (isOpen) {
            const loadProjects = async () => {
                setLoading(true);
                const data = await fetchProjects();
                setProjects(data);
                setLoading(false);
            };
            loadProjects();

            // Reset state asynchronously to avoid synchronous setState warning
            setTimeout(() => {
                setSelectedProject(null);
                setTasks([]);
            }, 0);
        }
    }, [isOpen, fetchProjects]);

    useEffect(() => {
        if (selectedProject) {
            const loadTasks = async () => {
                setLoading(true);
                const data = await fetchProjectTasks(selectedProject.id);
                setTasks(data);
                setLoading(false);
            };
            loadTasks();
        }
    }, [selectedProject, fetchProjectTasks]);

    const handleMoveTask = async (task: Goal) => {
        await moveTaskToToday(task.id, currentDate);
        // Remove from local list to reflect change immediately
        setTasks(prev => prev.filter(t => t.id !== task.id));
        onTaskMoved();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Chọn từ Kế hoạch</h2>
                        <p className="text-sm text-slate-500">Lấy công việc từ kế hoạch để làm hôm nay.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Project List */}
                    <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-950/30">
                        {loading && !selectedProject && <p className="p-4 text-center text-slate-400">Đang tải...</p>}
                        {projects.map(proj => (
                            <button
                                key={proj.id}
                                onClick={() => setSelectedProject(proj)}
                                className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-2 transition-colors ${selectedProject?.id === proj.id
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-semibold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                <Folder className="w-4 h-4" />
                                <span className="truncate">{proj.text}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right: Task List */}
                    <div className="w-2/3 overflow-y-auto p-4 bg-white dark:bg-slate-900">
                        {!selectedProject ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Folder className="w-12 h-12 mb-2 opacity-20" />
                                <p>Chọn một kế hoạch để xem nội dung</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="text-indigo-500">#</span> {selectedProject.text}
                                </h3>
                                {tasks.length === 0 && (
                                    <p className="text-slate-400 text-center py-8">Kế hoạch này chưa có việc nào.</p>
                                )}
                                {tasks.map(task => (
                                    <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all">
                                        <span className="text-slate-700 dark:text-slate-300">{task.text}</span>
                                        <button
                                            onClick={() => handleMoveTask(task)}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all dark:bg-indigo-900/30 dark:text-indigo-400"
                                        >
                                            Hôm nay <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
