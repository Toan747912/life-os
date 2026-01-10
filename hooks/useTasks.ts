import { useState, useCallback } from 'react';
import { supabase } from '@/app/supabase';
import { Goal } from '@/types';
import toast from 'react-hot-toast';

export const useTasks = (onCompleted?: (amount: number) => void, onDelete?: () => void) => {
    const [tasks, setTasks] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDateForDB = (dateObj: Date) => dateObj.toISOString().split('T')[0];

    const handleError = (error: any, message: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(error);
        toast.error(message, {
            style: { border: '1px solid #ef4444', color: '#ef4444' },
            icon: '🚨'
        });
    };

    const fetchTasks = useCallback(async (dateObj: Date) => {
        setLoading(true);
        const dateStr = formatDateForDB(dateObj);
        const todayStr = formatDateForDB(new Date());
        const isToday = dateStr === todayStr;

        let query = supabase
            .from('goals')
            .select('*');

        // Nếu xem Hôm nay: Lấy task hôm nay HOẶC (task quá khứ chưa xong)
        if (isToday) {
            query = query.or(`target_date.eq.${dateStr},and(target_date.lt.${dateStr},done.eq.false)`);
        } else {
            query = query.eq('target_date', dateStr);
        }

        const { data, error } = await query
            .order('priority', { ascending: false })
            .order('id', { ascending: true });

        if (error) {
            handleError(error, "Không thể tải danh sách công việc!");
        }
        setTasks((data as Goal[]) || []);
        setLoading(false);
    }, []);

    const addTask = useCallback(async (type = 'daily', currentDate: Date) => {
        // VALIDATION: Chặn spam task rỗng
        const emptyTasks = tasks.filter(g => !g.text || g.text.trim() === "").length;
        if (emptyTasks >= 3) {
            toast.error("Bạn có quá nhiều task chưa đặt tên. Hãy điền chúng trước!", { icon: '🧹' });
            return;
        }

        const dateStr = formatDateForDB(currentDate);
        const todayStr = formatDateForDB(new Date());

        if (dateStr < todayStr) {
            toast.error("Không thể thêm công việc cho quá khứ!", { icon: '🚫' });
            return;
        }

        const defaultCat = type === 'study' ? 'work' : 'other';

        const newTask = {
            text: "",
            target_date: dateStr,
            done: false,
            category: defaultCat,
            priority: 1,
            mode: 'normal',
            type: type
        };

        const { data, error } = await supabase.from('goals').insert(newTask).select();

        if (error) {
            handleError(error, "Lỗi khi thêm công việc mới!");
            return;
        }

        if (data) {
            setTasks(prev => [...prev, ...data]);
            if (type === 'study') toast('Đã tạo phiên làm việc sâu! 🧠', { icon: '🚀' });
            else toast.success('Đã thêm việc vặt!');
        }
    }, [tasks]);

    const deleteTask = useCallback(async (id: number) => {
        setTasks(prev => {
            return prev.filter((g) => g.id !== id);
        });
        if (onDelete) onDelete();
        toast.success('Đã xóa task!', { icon: '🗑️' });

        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            console.error("Error deleting goal:", error);
            toast.error("Không thể xóa task trên server!");
            fetchTasks(new Date()); // Fallback refresh
        }
    }, [fetchTasks, onDelete]);

    const toggleTaskDone = useCallback(async (id: number, currentStatus: boolean) => {
        // VALIDATION: Chỉ cho phép hoàn thành task trong ngày
        const goal = tasks.find(g => g.id === id);
        if (goal && !currentStatus && goal.target_date) {
            const todayStr = formatDateForDB(new Date());

            if (goal.target_date < todayStr) {
                toast.error("Task đã quá hạn! Không thể hoàn thành.", { icon: '🚫' });
                return;
            }
            if (goal.target_date > todayStr) {
                toast.error("Chưa đến ngày làm task này! Hãy đợi nhé.", { icon: '⏳' });
                return;
            }
        }

        const newStatus = !currentStatus;

        setTasks(prev => prev.map((g) => (g.id === id ? { ...g, done: newStatus } : g)));

        if (newStatus) {
            toast.success('Tuyệt vời! 💪 +10 XP');
            if (onCompleted) onCompleted(10);
        }

        const { error } = await supabase.from('goals').update({ done: newStatus }).eq('id', id);
        if (error) {
            console.error("Error updating goal status:", error);
            toast.error("Lỗi cập nhật trạng thái!");
            fetchTasks(new Date()); // Fallback refresh
        }
    }, [onCompleted, fetchTasks, tasks]);

    const updateTaskField = useCallback(async (id: number, field: keyof Goal, value: string | number) => {
        setTasks((currentGoals) => {
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
            toast.error("Lỗi lưu thay đổi!");
        }
    }, []);

    const updateTaskMode = useCallback(async (id: number, mode: 'strict' | 'normal') => {
        setTasks(prev => prev.map(g => g.id === id ? { ...g, mode } : g));
        const { error } = await supabase.from('goals').update({ mode }).eq('id', id);
        if (error) {
            console.error("Error updating mode:", error);
            toast.error("Không thể cập nhật chế độ!");
        }
    }, []);

    const reorderTasks = useCallback(async (newGoals: Goal[]) => {
        // Optimistic update
        setTasks(newGoals);

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
        } else {
            toast.success("Đã lưu thứ tự mới!", { id: 'reorder-success' });
        }
    }, []);

    // --- RECURRING TASKS LOGIC ---
    const TEMPLATE_DATE = '1000-01-01';

    const getRoutine = useCallback(async () => {
        const { data } = await supabase.from('goals').select('*').eq('target_date', TEMPLATE_DATE);
        return (data as Goal[]) || [];
    }, []);

    const addToRoutine = useCallback(async (text: string, category: string = 'work') => {
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
    }, []);

    const removeFromRoutine = useCallback(async (id: number) => {
        await supabase.from('goals').delete().eq('id', id);
        if (onDelete) onDelete();
        toast.success("Đã xóa khỏi Routine!");
    }, [onDelete]);

    const syncRoutine = useCallback(async (targetDate: Date) => {
        const targetDateStr = formatDateForDB(targetDate);
        const todayStr = formatDateForDB(new Date());

        if (targetDateStr < todayStr) {
            toast.error("Không thể đồng bộ Routine cho quá khứ!", { icon: '🚫' });
            return;
        }
        setLoading(true);

        const { data: templates } = await supabase.from('goals').select('*').eq('target_date', TEMPLATE_DATE);

        if (!templates || templates.length === 0) {
            setLoading(false);
            return;
        }

        const { data: currentTasks } = await supabase.from('goals').select('text').eq('target_date', targetDateStr);
        const currentTexts = new Set((currentTasks as { text: string }[])?.map(t => t.text) || []);

        const missing = templates.filter(t => !currentTexts.has(t.text));

        if (missing.length === 0) {
            setLoading(false);
            return;
        }

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
            setTasks(prev => [...prev, ...data]);
            toast.success(`Đã thêm ${data.length} task từ Routine!`);
        }
        setLoading(false);
    }, []);

    const moveTaskToToday = useCallback(async (taskId: number, dateObj: Date) => {
        const dateStr = formatDateForDB(dateObj);
        const todayStr = formatDateForDB(new Date());

        if (dateStr < todayStr) {
            toast.error("Không thể lên lịch cho quá khứ!", { icon: '🚫' });
            return;
        }

        const { count, error: countError } = await supabase
            .from('goals')
            .select('*', { count: 'exact', head: true })
            .eq('target_date', dateStr);

        if (!countError && count !== null && count >= 15) {
            toast.error("Ngày này đã quá tải (>15 task)! Hãy chọn ngày khác.", { icon: '🤯' });
            return;
        }

        const { data: task, error: fetchError } = await supabase
            .from('goals')
            .select('*')
            .eq('id', taskId)
            .single();

        if (fetchError || !task) {
            toast.error("Không tìm thấy công việc!");
            return;
        }

        if (task.parent_id && !task.target_date) {
            const { data: parentProject } = await supabase
                .from('goals')
                .select('target_date, text')
                .eq('id', task.parent_id)
                .single();

            if (parentProject && parentProject.target_date) {
                if (new Date(dateStr) > new Date(parentProject.target_date)) {
                    toast.error(`Không thể lên lịch! Dự án "${parentProject.text}" kết thúc vào ${parentProject.target_date}.`, { duration: 5000, icon: '🚫' });
                    return;
                }
            }

            const { data: existing } = await supabase
                .from('goals')
                .select('id')
                .eq('parent_id', task.parent_id)
                .eq('text', task.text)
                .eq('target_date', dateStr)
                .maybeSingle();

            if (existing) {
                toast.error("Công việc này đã có trong lịch hôm nay rồi!");
                return;
            }

            const newTask = {
                text: task.text,
                done: false,
                category: task.category,
                priority: task.priority,
                mode: 'normal',
                type: task.type,
                parent_id: task.parent_id,
                target_date: dateStr
            };

            const { error } = await supabase.from('goals').insert(newTask);
            if (error) {
                console.error(error);
                toast.error("Lỗi khi thêm vào ngày mới!");
            } else {
                toast.success("Đã thêm bản sao vào hôm nay!");
                fetchTasks(dateObj);
            }
        } else {
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
                fetchTasks(dateObj);
            }
        }
    }, [fetchTasks]);

    return {
        tasks,
        setTasks,
        loading,
        setLoading,
        fetchTasks,
        addTask,
        deleteTask,
        toggleTaskDone,
        updateTaskField,
        updateTaskMode,
        reorderTasks,
        getRoutine,
        addToRoutine,
        removeFromRoutine,
        syncRoutine,
        moveTaskToToday
    };
};
