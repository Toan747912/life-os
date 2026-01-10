import React, { useState, useEffect } from 'react';
import { useSound } from "@/hooks/useSound";
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Goal } from '@/types';
import { ArrowLeft, Plus, Folder, Calendar, Target, Clock, Save, Edit2, BookOpen, CheckSquare, Square, Loader2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
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
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Component con để xử lý item kéo thả
function SortableTaskItem({ task, children }: { task: Goal, children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                <GripVertical size={16} />
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

export default function ProjectManager() {
    const { playSound } = useSound();
    useTasks(() => playSound('complete'));
    const { fetchProjects, addProject, updateProject, deleteProject, fetchProjectTasks, addTaskToProject, reorderProjectTasks } = useProjects();
    const [projects, setProjects] = useState<Goal[]>([]);
    const [activeProject, setActiveProject] = useState<Goal | null>(null);
    const [projectTasks, setProjectTasks] = useState<Goal[]>([]);

    // Create States
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectType, setNewProjectType] = useState<string>('general');
    const [newProjectDate, setNewProjectDate] = useState<string>("");
    const [newProjectScore, setNewProjectScore] = useState<string>("");

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editScore, setEditScore] = useState("");
    const [editType, setEditType] = useState("general");

    const [newTaskName, setNewTaskName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // New state for button loading

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const backlogTasks = projectTasks.filter(t => !t.target_date);
            const oldIndex = backlogTasks.findIndex((t) => t.id === active.id);
            const newIndex = backlogTasks.findIndex((t) => t.id === over.id);
            const newBacklog = arrayMove(backlogTasks, oldIndex, newIndex);

            const scheduledTasks = projectTasks.filter(t => t.target_date);
            setProjectTasks([...scheduledTasks, ...newBacklog]);
            reorderProjectTasks(newBacklog);
        }
    };

    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true);
            const data = await fetchProjects();
            setProjects(data);
            setLoading(false);
        };
        loadProjects();
    }, [fetchProjects]);

    useEffect(() => {
        const loadProjectTasks = async () => {
            if (activeProject) {
                const data = await fetchProjectTasks(activeProject.id);
                setProjectTasks(data);
                // Reset edit state when switching projects
                setIsEditing(false);
                setEditName(activeProject.text);
                setEditDate(activeProject.target_date || "");
                setEditScore(activeProject.priority ? activeProject.priority.toString() : "");
                setEditType(activeProject.category || 'general');
            }
        };
        loadProjectTasks();
    }, [activeProject, fetchProjectTasks]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        setIsSubmitting(true);

        const date = newProjectDate || null;
        const score = newProjectScore ? parseInt(newProjectScore) : null;

        const newProj = await addProject(newProjectName, newProjectType, date, score);

        if (newProj) {
            setProjects([newProj, ...projects]);
            setNewProjectName("");
            setNewProjectDate("");
            setNewProjectScore("");
            setNewProjectType('general');
        }
        setIsSubmitting(false);
    };

    const handleUpdateProject = async () => {
        if (!activeProject || !editName.trim()) return;

        const updates: Partial<Goal> = {
            text: editName.trim(),
            target_date: editDate || null || undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            priority: (editScore ? parseInt(editScore) : null) as any,
            category: editType
        };

        const success = await updateProject(activeProject.id, updates);
        if (success) {
            setActiveProject({ ...activeProject, ...updates } as Goal);
            setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, ...updates } as Goal : p));
            setIsEditing(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskName.trim() || !activeProject) return;
        setIsSubmitting(true);

        const newTask = await addTaskToProject(activeProject.id, newTaskName);
        if (newTask) {
            setProjectTasks([...projectTasks, newTask]);
            setNewTaskName("");
            toast.success("Đã thêm vào Danh sách việc!");
        }
        setIsSubmitting(false);
    };



    const handleDeleteProject = async (projectId: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa kế hoạch này? Tất cả công việc trong đó sẽ bị xóa!")) {
            const success = await deleteProject(projectId);
            if (success) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
                setActiveProject(null);
            }
        }
    };

    const getPriorityColor = (priority?: number) => {
        if (!priority) return 'bg-slate-300';
        if (priority >= 3) return 'bg-red-500';
        if (priority === 2) return 'bg-amber-500';
        return 'bg-blue-500';
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'exam': return <Target className="w-5 h-5 text-red-500" />;
            case 'assignment': return <BookOpen className="w-5 h-5 text-amber-500" />;
            default: return <Folder className="w-5 h-5 text-indigo-500" />;
        }
    };

    const getTypeLabel = (type?: string) => {
        switch (type) {
            case 'exam': return 'Ôn thi';
            case 'assignment': return 'Đồ án / Bài tập';
            default: return 'Dự án chung';
        }
    };

    // PROJECT LIST VIEW
    if (!activeProject) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
                    <Folder className="w-6 h-6 text-indigo-500" />
                    Quản lý Kế hoạch
                </h2>

                <form onSubmit={handleCreateProject} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-8 space-y-3">
                    <div className="flex gap-2">
                        <select
                            value={newProjectType}
                            onChange={(e) => setNewProjectType(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                        >
                            <option value="general">📝 Chung</option>
                            <option value="assignment">🎓 Đồ án</option>
                            <option value="exam">📚 Ôn thi</option>
                        </select>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Tên kế hoạch mới..."
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        {/* Date Picker */}
                        <div className="flex-1 relative">
                            <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={newProjectDate}
                                onChange={(e) => setNewProjectDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                            />
                        </div>

                        {/* Extra Field for Exam */}
                        {newProjectType === 'exam' && (
                            <div className="flex-1 relative">
                                <Target className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    value={newProjectScore}
                                    onChange={(e) => setNewProjectScore(e.target.value)}
                                    placeholder="Điểm mục tiêu (0-10)"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                                />
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 rounded-xl font-semibold transition-all flex items-center gap-2 min-w-[100px] justify-center">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isSubmitting ? "..." : "Tạo"}
                        </button>
                    </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => setActiveProject(project)}
                            className="p-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition-all group relative overflow-hidden"
                        >
                            {/* Type Badge */}
                            <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 shadow-xs">
                                {getTypeLabel(project.category)}
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {project.text}
                                </h3>
                                {getTypeIcon(project.category)}
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                                {project.target_date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(project.target_date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                )}
                                {project.category === 'exam' && project.priority && (
                                    <div className="flex items-center gap-1 text-indigo-500 font-bold">
                                        <Target className="w-3.5 h-3.5" />
                                        <span>Mục tiêu: {project.priority}đ</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {loading && <p className="text-center text-slate-400 mt-4">Đang tải...</p>}
            </div>
        );
    }

    // PROJECT DETAIL VIEW
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            {/* Header / Edit Form */}
            <div className="flex items-start gap-4 mb-6">
                <button
                    onClick={() => setActiveProject(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>

                <div className="flex-1">
                    {!isEditing ? (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {getTypeLabel(activeProject.category)}
                                </span>
                                {activeProject.category === 'exam' && activeProject.priority && (
                                    <span className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Target className="w-3 h-3" /> Mục tiêu: {activeProject.priority}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                {getTypeIcon(activeProject.category)}
                                {activeProject.text}
                                <button onClick={() => setIsEditing(true)} className="ml-2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </h2>

                            {activeProject.target_date && (
                                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                    <Clock className="w-4 h-4" />
                                    Deadline: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(activeProject.target_date).toLocaleDateString('vi-VN')}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                            <h3 className="text-sm font-bold text-slate-500">Chỉnh sửa kế hoạch</h3>
                            <div className="flex gap-2">
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                >
                                    <option value="general">📝 Chung</option>
                                    <option value="assignment">🎓 Đồ án</option>
                                    <option value="exam">📚 Ôn thi</option>
                                </select>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white"
                                />
                                {editType === 'exam' && (
                                    <input
                                        type="number"
                                        placeholder="Điểm mục tiêu"
                                        value={editScore}
                                        onChange={(e) => setEditScore(e.target.value)}
                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white"
                                    />
                                )}
                                <button onClick={handleUpdateProject} className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                    <Save className="w-4 h-4" /> Lưu
                                </button>
                                <button onClick={() => setIsEditing(false)} className="text-slate-500 px-3 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <button
                        onClick={() => handleDeleteProject(activeProject.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
                    >
                        Xóa kế hoạch
                    </button>
                )}
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-sm font-uppercase text-slate-400 font-bold tracking-wider">DANH SÁCH VIỆC</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{projectTasks.filter(t => t.done).length}/{projectTasks.length} hoàn thành</span>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Thêm việc cần làm..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 rounded-xl font-semibold transition-all min-w-[90px] flex justify-center items-center">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Thêm"}
                    </button>
                </form>

                <div className="space-y-2">
                    {projectTasks.filter(t => !t.target_date).length === 0 && <p className="text-slate-400 text-center py-8">Kế hoạch này chưa có đầu việc nào.</p>}

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={projectTasks.filter(t => !t.target_date).map(t => t.id)} strategy={verticalListSortingStrategy}>
                            {projectTasks.filter(t => !t.target_date).map(task => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const instances = projectTasks.filter(t => t.target_date);
                                const todayInstance = instances.find(i => i.text === task.text && i.target_date === todayStr);
                                const isDoneToday = todayInstance?.done;
                                const isScheduled = !!todayInstance;

                                return (
                                    <SortableTaskItem key={task.id} task={task}>
                                        <div
                                            className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-950/50 rounded-xl border transition-all group w-full ${isDoneToday
                                                ? 'border-slate-100 dark:border-slate-800 opacity-60'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-700 shadow-xs'
                                                }`}
                                        >
                                            <div className="text-slate-300">
                                                {isDoneToday ? <CheckSquare className="w-6 h-6 text-indigo-500" /> : <Square className="w-6 h-6" />}
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <span className={`text-slate-700 dark:text-slate-300 transition-all ${isDoneToday ? 'line-through text-slate-400' : ''}`}>
                                                    {task.text}
                                                </span>
                                                {isScheduled && !isDoneToday && (
                                                    <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Đã lên lịch hôm nay</span>
                                                    </div>
                                                )}
                                                {isDoneToday && (
                                                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                                                        <CheckSquare className="w-3 h-3" />
                                                        <span>Đã làm xong hôm nay</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Priority Indicator */}
                                            {task.priority && task.priority > 1 && (
                                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`}></div>
                                            )}

                                            <span className={`text-xs px-2 py-1 rounded border opacity-0 group-hover:opacity-100 transition-opacity ${isDoneToday
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : isScheduled
                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {isDoneToday ? 'Hoàn thành' : isScheduled ? 'Đã lên lịch' : 'Checklist'}
                                            </span>
                                        </div>
                                    </SortableTaskItem>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
