"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import toast, { Toaster } from 'react-hot-toast';

import { useGamification } from "@/hooks/useGamification";
import { useSound } from "@/hooks/useSound";
import { useConfetti } from "@/hooks/useConfetti";
import PomodoroModal from "@/components/PomodoroModal";
import SettingsModal from "@/components/SettingsModal";
import ConfirmModal from "@/components/ConfirmModal";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import Analytics from "@/components/Analytics";
import CalendarView from "@/components/CalendarView";
import { Goal } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import ProjectManager from "@/components/ProjectManager";
import ProjectPickerModal from "@/components/ProjectPickerModal";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
import ProfileView from "@/components/ProfileView";
import { Filter, X } from "lucide-react";

const QUOTES = [
  "Không làm mà đòi có ăn thì... đi ngủ đi!",
  "Hôm nay không đi thì ngày mai phải chạy.",
  "Kỷ luật là tự do.",
  "Code đi đừng sợ, Bug thì fix!",
  "Đau đớn của kỷ luật còn hơn đau đớn của hối hận.",
];

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [darkMode, setDarkMode] = useState(false);
  const [quote, setQuote] = useState("");
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Gamification Hook
  const { addXP } = useGamification(session);
  const { playSound } = useSound();
  const { triggerConfetti } = useConfetti();

  // Custom Hook
  const {
    tasks,
    loading,
    setLoading, // Needed for initial auth check
    setTasks, // Needed for Auth logout clear
    fetchTasks,
    addTask,
    deleteTask,
    toggleTaskDone,
    updateTaskField,
    updateTaskMode,
    reorderTasks,
    syncRoutine
  } = useTasks((amount) => {
    // onCompleted
    addXP(amount);
    playSound('complete');
    triggerConfetti();
  }, () => {
    // onDelete
    playSound('delete');
  });

  // State cho Pomodoro
  const [focusTask, setFocusTask] = useState<Goal | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, taskId: number | null }>({ isOpen: false, taskId: null });
  const [view, setView] = useState<'tasks' | 'analytics' | 'calendar' | 'projects' | 'profile'>('tasks');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastUpdate = useMemo(() => Date.now(), [tasks]);

  const progress = tasks.length === 0 ? 0 : Math.round((tasks.filter(g => g.done).length / tasks.length) * 100);

  // --- LOGIC LỌC TASK (DUE SOON / OVERDUE) ---
  const displayedTasks = useMemo(() => {
    if (!isFilterActive) return tasks;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter(g => {
      if (g.done) return false; // Ẩn task đã xong khi lọc
      if (!g.target_date) return false;
      const target = new Date(g.target_date);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3; // Lấy task Quá hạn (<0) hoặc Sắp đến hạn (<=3)
    });
  }, [tasks, isFilterActive]);

  // --- LOGIC KIỂM TRA QUÁ KHỨ (UI) ---
  const isPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewDate = new Date(currentDate);
    viewDate.setHours(0, 0, 0, 0);
    return viewDate < today;
  }, [currentDate]);

  // --- HÀM XỬ LÝ MODE ---
  const handleRequestStrictMode = useCallback((taskId: number) => {
    setConfirmModal({ isOpen: true, taskId: taskId });
  }, []);

  const confirmStrictMode = async () => {
    const taskId = confirmModal.taskId;
    if (!taskId) return;
    updateTaskMode(taskId, 'strict');
    setConfirmModal({ ...confirmModal, isOpen: false });
    toast("Đã bật chế độ Nghiêm khắc. Chúc may mắn!", { icon: '🔒' });
  };

  // --- AUTH & EFFECTS ---
  const handleLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}/auth/callback` } }); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    fetchTasks(newDate);
  };

  const toggleTheme = () => { const m = !darkMode; setDarkMode(m); localStorage.setItem("theme", m ? "dark" : "light"); };

  // Auto-Refresh Date at midnight (Stale Date Fix)
  useEffect(() => {
    const checkDate = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
        fetchTasks(now);
        toast("Đã sang ngày mới! 🌅", { icon: '📅' });
      }
    }, 60000); // Check every minute
    return () => clearInterval(checkDate);
  }, [currentDate, fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => { if (!quote) setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]); }, 0);
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchTasks(new Date()); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) fetchTasks(new Date()); else setTasks([]); });
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, [fetchTasks, quote, setLoading, setTasks]);

  // Wrapper để giữ reference ổn định cho handleAddTask
  const handleAddTaskWrapper = useCallback((type?: string) => {
    addTask(type, currentDate);
  }, [addTask, currentDate]);


  // --- GIAO DIỆN (ĐÃ NÂNG CẤP DASHBOARD) ---
  return (
    <div className={darkMode ? "dark" : ""}>
      {!session ? (
        <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-white/20">
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Life OS ✨</h1>
            <p className="text-slate-500 mb-6">Hệ điều hành cuộc đời bạn.</p>
            <button onClick={handleLogin} className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all">Login GitHub</button>
          </div>
        </main>
      ) : (
        <main className="min-h-screen p-0 md:p-8 transition-colors duration-500 bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8">

          {/* MOBILE HEADER */}
          <MobileHeader
            session={session}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
          />

          {/* CONTAINER CHÍNH: Layout 2 Cột */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-0">

            {/* CỘT TRÁI (SIDEBAR) */}
            {/* CỘT TRÁI (SIDEBAR) */}
            <div className="hidden md:block md:col-span-3 lg:col-span-3 space-y-6">
              <Sidebar
                session={session}
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                currentDate={currentDate}
                changeDate={changeDate}
                progress={progress}
                quote={quote}
                view={view}
                setView={setView}
              />
            </div>

            {/* CỘT PHẢI (MAIN CONTENT) */}
            <div className="md:col-span-9 lg:col-span-9 space-y-6">

              {view === 'tasks' && (
                <>
                  <Header
                    doneCount={tasks.filter(g => g.done).length}
                    totalCount={tasks.length}
                  >
                    <button
                      onClick={() => setIsFilterActive(!isFilterActive)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${isFilterActive
                        ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`}
                    >
                      {isFilterActive ? <X size={14} /> : <Filter size={14} />}
                      {isFilterActive ? "Bỏ lọc" : "Cần làm gấp"}
                    </button>

                    {/* Chỉ hiện nút Sync và Dự án nếu KHÔNG PHẢI quá khứ */}
                    {!isPast && (
                      <>
                        <button
                          onClick={() => syncRoutine(currentDate)}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-colors border border-transparent"
                        >
                          ⚡ Sync
                        </button>

                        <button
                          onClick={() => setProjectPickerOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          📂 Dự án
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setRecurringModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-colors"
                      title="Cài đặt"
                    >
                      ⚙️
                    </button>
                  </Header>



                  <TaskList
                    loading={loading}
                    goals={displayedTasks}
                    handleAddTask={handleAddTaskWrapper}
                    // Truyền prop isPast xuống TaskList để ẩn input
                    isPast={isPast}
                    toggleDone={toggleTaskDone}
                    handleUpdateField={updateTaskField}
                    handleDeleteTask={deleteTask}
                    setFocusTask={setFocusTask}
                    handleRequestStrictMode={handleRequestStrictMode}
                    onReorder={reorderTasks}
                  />
                </>
              )}

              {view === 'analytics' && <Analytics goals={tasks} />}

              {view === 'calendar' && (
                <CalendarView
                  currentDate={currentDate}
                  onSelectDate={(date: Date) => {
                    setCurrentDate(date);
                    fetchTasks(date);
                    setView('tasks');
                  }}
                  lastUpdate={lastUpdate} // Trigger refresh on render since goals change re-renders parent
                />
              )}

              {view === 'projects' && <ProjectManager />}

              {view === 'profile' && <ProfileView session={session} goals={tasks} />}

            </div>

          </div>



          {/* MOBILE NAVIGATION */}
          <MobileNav view={view} setView={setView} />

        </main>
      )
      }

      {/* Settings Modal */}
      <SettingsModal
        isOpen={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        toggleTheme={toggleTheme}
        isDarkMode={darkMode}
        currentUser={null}
        handleLogout={handleLogout}
      />

      {/* Project Picker Modal */}
      <ProjectPickerModal
        isOpen={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        currentDate={currentDate}
        onTaskMoved={() => {
          setProjectPickerOpen(false);
          fetchTasks(currentDate); // Refresh today's list
        }}
      />

      {/* Pomodoro Modal */}
      {
        focusTask && (
          <PomodoroModal
            task={focusTask}
            onClose={() => setFocusTask(null)}
            onUpdateSession={(id: number, sessions: number) => updateTaskField(id, 'completed_sessions', sessions)}
          />
        )
      }

      {/* Modal xác nhận Strict Mode */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmStrictMode}
      />
      <Toaster position="bottom-center" />
    </div >
  );
}