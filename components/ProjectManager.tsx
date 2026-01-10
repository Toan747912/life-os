import React, { useState, useEffect } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types';
import { ArrowLeft, Plus, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectManager() {
    const { fetchProjects, addProject, deleteProject, fetchProjectTasks, addTaskToProject } = useGoals();
    const [projects, setProjects] = useState<Goal[]>([]);
    const [activeProject, setActiveProject] = useState<Goal | null>(null);
    const [projectTasks, setProjectTasks] = useState<Goal[]>([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [newTaskName, setNewTaskName] = useState("");
    const [loading, setLoading] = useState(false);



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
            }
        };
        loadProjectTasks();
    }, [activeProject, fetchProjectTasks]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        const newProj = await addProject(newProjectName);
        if (newProj) {
            setProjects([newProj, ...projects]);
            setNewProjectName("");
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskName.trim() || !activeProject) return;
        const newTask = await addTaskToProject(activeProject.id, newTaskName);
        if (newTask) {
            setProjectTasks([...projectTasks, newTask]);
            setNewTaskName("");
            toast.success("Đã thêm vào Backlog!");
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa dự án này? Tất cả backlog sẽ bị xóa!")) {
            const success = await deleteProject(projectId);
            if (success) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
                setActiveProject(null);
            }
        }
    };

    // PROJECT LIST VIEW
    if (!activeProject) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
                    <Folder className="w-6 h-6 text-indigo-500" />
                    Quản lý Dự án
                </h2>

                <form onSubmit={handleCreateProject} className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Tên dự án mới..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-semibold transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => setActiveProject(project)}
                            className="p-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition-all group"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {project.text}
                                </h3>
                                <Folder className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Click để xem backlog</p>
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
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => setActiveProject(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Folder className="w-6 h-6 text-indigo-500" />
                        {activeProject.text}
                    </h2>
                </div>
                <button
                    onClick={() => handleDeleteProject(activeProject.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    Xóa dự án
                </button>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-uppercase text-slate-400 font-bold mb-4 tracking-wider">PROJECT BACKLOG</h3>
                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Thêm đầu việc vào backlog..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-semibold transition-all">
                        Thêm
                    </button>
                </form>

                <div className="space-y-2">
                    {projectTasks.length === 0 && <p className="text-slate-400 text-center py-8">Chưa có công việc nào trong backlog.</p>}
                    {projectTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                            <span className="text-slate-700 dark:text-slate-300 flex-1">{task.text}</span>
                            <span className="text-xs text-slate-400 px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">Backlog</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
