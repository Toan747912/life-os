import { useState, useCallback } from 'react';
import { supabase } from '@/app/supabase';
import { Goal } from '@/types';
import toast from 'react-hot-toast';

export const useProjects = () => {
    const [loading, setLoading] = useState(false);

    const handleError = (error: any, message: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(error);
        toast.error(message, {
            style: { border: '1px solid #ef4444', color: '#ef4444' },
            icon: '🚨'
        });
    };

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('type', 'project')
            .order('priority', { ascending: false })
            .order('id', { ascending: true });

        if (error) {
            console.error("Error fetching projects:", error);
            handleError(error, "Không thể tải danh sách kế hoạch!");
            setLoading(false);
            return [];
        }
        setLoading(false);
        return (data as Goal[]) || [];
    }, []);

    const addProject = useCallback(async (name: string, type: string = 'general', date: string | null = null, score: number | null = null) => {
        if (!name.trim()) {
            toast.error("Tên kế hoạch không được để trống!");
            return null;
        }
        if (name.trim().length < 3) {
            toast.error("Tên kế hoạch quá ngắn (tối thiểu 3 ký tự)!");
            return null;
        }
        if (name.length > 50) {
            toast.error("Tên kế hoạch quá dài (>50 ký tự)!");
            return null;
        }

        // VALIDATION: Không cho phép tạo dự án với deadline trong quá khứ
        if (date && new Date(date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            toast.error("Deadline dự án không thể ở trong quá khứ!");
            return null;
        }

        const newProject = {
            text: name.trim(),
            done: false,
            category: type, // 'general' | 'assignment' | 'exam'
            target_date: date, // Deadline or Exam Date
            priority: score || 1, // Target Score for Exam, or Priority
            mode: 'normal',
            type: 'project'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.from('goals').insert(newProject as any).select();

        if (error) {
            console.error(error);
            handleError(error, "Lỗi khi tạo kế hoạch!");
            return null;
        }
        toast.success("Đã tạo kế hoạch mới!");
        return data?.[0];
    }, []);

    const updateProject = useCallback(async (id: number, updates: Partial<Goal>) => {
        const { error } = await supabase.from('goals').update(updates).eq('id', id);

        if (error) {
            handleError(error, "Lỗi khi cập nhật kế hoạch!");
            return false;
        }
        toast.success("Đã cập nhật kế hoạch!");
        return true;
    }, []);

    const deleteProject = useCallback(async (projectId: number) => {
        const { error: tasksError } = await supabase
            .from('goals')
            .delete()
            .eq('parent_id', projectId);

        if (tasksError) {
            handleError(tasksError, "Lỗi khi xóa các công việc!");
            return false;
        }

        const { error: projError } = await supabase
            .from('goals')
            .delete()
            .eq('id', projectId);

        if (projError) {
            handleError(projError, "Lỗi khi xóa kế hoạch!");
            return false;
        }

        toast.success("Đã xóa kế hoạch và toàn bộ công việc!");
        return true;
    }, []);

    const fetchProjectTasks = useCallback(async (projectId: number) => {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('parent_id', projectId)
            .order('priority', { ascending: false })
            .order('id', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }
        return (data as Goal[]) || [];
    }, []);

    const addTaskToProject = useCallback(async (projectId: number, text: string) => {
        if (!text.trim()) {
            toast.error("Nội dung task không được để trống!");
            return null;
        }
        if (text.length > 200) {
            toast.error("Nội dung task quá dài (tối đa 200 ký tự)!");
            return null;
        }

        const newTask = {
            text,
            done: false,
            category: 'work',
            priority: 1,
            mode: 'normal',
            type: 'project_task',
            parent_id: projectId
        };
        const { data, error } = await supabase.from('goals').insert(newTask).select();
        if (error) {
            handleError(error, "Failed to add task!");
            return null;
        }
        return data?.[0];
    }, []);

    const reorderProjectTasks = useCallback(async (newTasks: Goal[]) => {
        const updates = newTasks.map((t, index) => ({
            id: t.id,
            priority: newTasks.length - index,
        }));

        const { error } = await supabase.from('goals').upsert(
            updates.map(u => ({ id: u.id, priority: u.priority }))
        );

        if (error) {
            console.error("Reorder error:", error);
            toast.error("Không thể lưu thứ tự!");
        }
    }, []);

    return {
        loading,
        fetchProjects,
        addProject,
        updateProject,
        deleteProject,
        fetchProjectTasks,
        addTaskToProject,
        reorderProjectTasks
    };
};
