import { useState, useCallback } from 'react';
import { supabase } from '@/app/supabase';
import { Goal } from '@/types';
import toast from 'react-hot-toast';

export const useGoals = (onCompleted?: (amount: number) => void) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDateForDB = (dateObj: Date) => dateObj.toISOString().split('T')[0];

    const handleError = (error: any, message: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(error);
        toast.error(message, {
            style: { border: '1px solid #ef4444', color: '#ef4444' },
            icon: '🚨'
        });
    };

    const fetchGoals = useCallback(async (dateObj: Date) => {
        setLoading(true);
        const dateStr = formatDateForDB(dateObj);
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('target_date', dateStr)
            // .is('parent_id', null) <-- Removed to allow Project Tasks (with parent_id) to show if they have a target_date
            .order('priority', { ascending: false })
            .order('id', { ascending: true });

        if (error) {
            handleError(error, "Không thể tải danh sách công việc!");
        }
        setGoals((data as Goal[]) || []);
        setLoading(false);
    }, []);

    const addGoal = async (type = 'daily', currentDate: Date) => {
        const dateStr = formatDateForDB(currentDate);
        const defaultCat = type === 'study' ? 'work' : 'other';

        const newGoal = {
            text: "",
            target_date: dateStr,
            done: false,
            category: defaultCat,
            priority: 1,
            mode: 'normal',
            type: type
        };

        const { data, error } = await supabase.from('goals').insert(newGoal).select();

        if (error) {
            handleError(error, "Lỗi khi thêm công việc mới!");
            return;
        }

        if (data) {
            setGoals(prev => [...prev, ...data]);
            if (type === 'study') toast('Đã tạo phiên làm việc sâu! 🧠', { icon: '🚀' });
            else toast.success('Đã thêm việc vặt!');
        }
    };

    const deleteGoal = async (id: number) => {
        const originalGoals = [...goals];
        setGoals(prev => prev.filter((g) => g.id !== id));
        toast.success('Đã xóa task!', { icon: '🗑️' });

        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            console.error("Error deleting goal:", error);
            toast.error("Không thể xóa task trên server!");
            setGoals(originalGoals); // Rollback
        }
    };

    const toggleGoalDone = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const originalGoals = [...goals];

        setGoals(prev => prev.map((g) => (g.id === id ? { ...g, done: newStatus } : g)));

        if (newStatus) {
            toast.success('Tuyệt vời! 💪 +10 XP');
            if (onCompleted) onCompleted(10);
        }

        const { error } = await supabase.from('goals').update({ done: newStatus }).eq('id', id);
        if (error) {
            console.error("Error updating goal status:", error);
            toast.error("Lỗi cập nhật trạng thái!");
            setGoals(originalGoals); // Rollback
        }
    };

    const updateGoalField = async (id: number, field: keyof Goal, value: string | number) => {
        const originalGoals = [...goals];

        setGoals((currentGoals) => {
            const newGoals = currentGoals.map((g) => {
                if (g.id === id) return { ...g, [field]: value };
                return g;
            });
            if (field === 'priority') newGoals.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            return newGoals;
        });

        const { error } = await supabase.from('goals').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error(`Error updating goal ${field}:`, error);
            toast.error("Lỗi lưu thay đổi! Đang hoàn tác...");
            // Rollback Logic
            setGoals(originalGoals);
        }
    };

    const updateGoalMode = async (id: number, mode: 'strict' | 'normal') => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, mode } : g));
        const { error } = await supabase.from('goals').update({ mode }).eq('id', id);
        if (error) {
            console.error("Error updating mode:", error);
            toast.error("Không thể cập nhật chế độ!");
        }
    };

    const reorderGoals = async (newGoals: Goal[]) => {
        const originalGoals = [...goals];
        // Optimistic update
        setGoals(newGoals);

        // Calculate new priorities (reveresed index)
        const updates = newGoals.map((g, index) => ({
            id: g.id,
            priority: newGoals.length - index,
        }));

        const { error } = await supabase.from('goals').upsert(
            updates.map(u => ({ id: u.id, priority: u.priority }))
        );

        if (error) {
            console.error("Reorder error:", error);
            toast.error("Không thể lưu thứ tự!");
            setGoals(originalGoals); // Rollback to original order
        } else {
            toast.success("Đã lưu thứ tự mới!", { id: 'reorder-success' });
        }
    };

    // --- RECURRING TASKS LOGIC ---
    const TEMPLATE_DATE = '1000-01-01';

    const getRoutine = async () => {
        const { data } = await supabase.from('goals').select('*').eq('target_date', TEMPLATE_DATE);
        return (data as Goal[]) || [];
    };

    const addToRoutine = async (text: string, category: string = 'work') => {
        const newTemplate = {
            text,
            target_date: TEMPLATE_DATE,
            done: false,
            category,
            priority: 1,
            mode: 'normal',
            type: 'routine_template'
        };
        const { error } = await supabase.from('goals').insert(newTemplate);
        if (error) {
            toast.error("Lỗi khi thêm routine!");
            console.error(error);
        } else {
            toast.success("Đã thêm vào Routine!");
        }
    };

    const removeFromRoutine = async (id: number) => {
        await supabase.from('goals').delete().eq('id', id);
        toast.success("Đã xóa khỏi Routine!");
    };

    const syncRoutine = async (targetDate: Date) => {
        setLoading(true);
        const targetDateStr = formatDateForDB(targetDate);

        // 1. Get Templates
        const templates = await getRoutine();
        if (templates.length === 0) {
            setLoading(false);
            return;
        }

        // 2. Get Current Tasks
        const { data: currentTasks } = await supabase.from('goals').select('text').eq('target_date', targetDateStr);
        const currentTexts = new Set((currentTasks as { text: string }[])?.map(t => t.text) || []);

        // 3. Filter missing
        const missing = templates.filter(t => !currentTexts.has(t.text));

        if (missing.length === 0) {
            setLoading(false);
            return;
        }

        // 4. Insert missing
        const newTasks = missing.map(t => ({
            text: t.text,
            target_date: targetDateStr,
            done: false,
            category: t.category,
            priority: t.priority,
            mode: 'normal',
            type: 'daily_routine'
        }));

        const { data } = await supabase.from('goals').insert(newTasks).select();

        if (data) {
            setGoals(prev => [...prev, ...data]);
            toast.success(`Đã thêm ${data.length} task từ Routine!`);
        }
        setLoading(false);
    };

    // --- PROJECT MANAGEMENT LOGIC ---

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('type', 'project')
            .order('id', { ascending: false });

        if (error) {
            console.error("Error fetching projects:", error);
            handleError(error, "Không thể tải danh sách dự án!");
            setLoading(false);
            return [];
        }
        setLoading(false);
        return (data as Goal[]) || [];
    }, []);

    const addProject = async (name: string) => {
        if (!name.trim()) {
            toast.error("Tên dự án không được để trống!");
            return null;
        }
        if (name.length > 50) {
            toast.error("Tên dự án quá dài (>50 ký tự)!");
            return null;
        }

        const { data: existing } = await supabase
            .from('goals')
            .select('id')
            .eq('type', 'project')
            .ilike('text', name.trim())
            .maybeSingle();

        if (existing) {
            toast.error("Dự án này đã tồn tại!");
            return null;
        }

        const newProject = {
            text: name.trim(),
            done: false,
            category: 'work',
            priority: 1,
            mode: 'normal',
            type: 'project'
        };
        const { data, error } = await supabase.from('goals').insert(newProject).select();
        if (error) {
            handleError(error, "Lỗi khi tạo dự án!");
            return null;
        }
        toast.success("Đã tạo dự án mới!");
        return data?.[0];
    };

    const deleteProject = async (projectId: number) => {
        const { error: tasksError } = await supabase
            .from('goals')
            .delete()
            .eq('parent_id', projectId);

        if (tasksError) {
            handleError(tasksError, "Lỗi khi xóa backlog!");
            return false;
        }

        const { error: projError } = await supabase
            .from('goals')
            .delete()
            .eq('id', projectId);

        if (projError) {
            handleError(projError, "Lỗi khi xóa dự án!");
            return false;
        }

        toast.success("Đã xóa dự án và toàn bộ backlog!");
        return true;
    };

    const fetchProjectTasks = useCallback(async (projectId: number) => {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('parent_id', projectId)
            .is('target_date', null)
            .order('id', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }
        return (data as Goal[]) || [];
    }, []);

    const addTaskToProject = async (projectId: number, text: string) => {
        if (!text.trim()) {
            toast.error("Nội dung task không được để trống!");
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
    };

    const moveTaskToToday = async (taskId: number, dateObj: Date) => {
        const dateStr = formatDateForDB(dateObj);

        // KHÔNG đổi type thành 'daily'. Giữ nguyên type cũ để UI biết đây là task Dự án.
        const { error } = await supabase
            .from('goals')
            .update({
                target_date: dateStr
            })
            .eq('id', taskId);

        if (error) {
            toast.error("Lỗi khi chuyển task!");
        } else {
            toast.success("Đã lên lịch cho hôm nay!");
            fetchGoals(dateObj);
        }
    };

    return {
        goals,
        setGoals,
        loading,
        setLoading,
        fetchGoals,
        addGoal,
        deleteGoal,
        toggleGoalDone,
        updateGoalField,
        updateGoalMode,
        reorderGoals,
        getRoutine,
        addToRoutine,
        removeFromRoutine,
        syncRoutine,
        fetchProjects,
        addProject,
        deleteProject,
        fetchProjectTasks,
        addTaskToProject,
        moveTaskToToday
    };
};
