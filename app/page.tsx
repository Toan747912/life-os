"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import toast, { Toaster } from 'react-hot-toast';

import { useGamification } from "@/hooks/useGamification";
import { useSound } from "@/hooks/useSound";
import PomodoroModal from "@/components/PomodoroModal";
import RecurringModal from "@/components/RecurringModal";
import ConfirmModal from "@/components/ConfirmModal";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import Analytics from "@/components/Analytics";
import CalendarView from "@/components/CalendarView";
import { Goal } from "@/types";
import { useGoals } from "@/hooks/useGoals";
import ProjectManager from "@/components/ProjectManager";
import ProjectPickerModal from "@/components/ProjectPickerModal";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";

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

  // Gamification Hook
  const { addXP } = useGamification(session);
  const { playSound } = useSound();

  // Custom Hook
  const {
    goals,
    loading,
    setLoading, // Needed for initial auth check
    setGoals, // Needed for Auth logout clear
    fetchGoals,
    addGoal,
    deleteGoal,
    toggleGoalDone,
    updateGoalField,
    updateGoalMode,
    reorderGoals,
    syncRoutine
  } = useGoals((amount) => {
    addXP(amount);
    playSound('complete');
  });

  // State cho Pomodoro
  const [focusTask, setFocusTask] = useState<Goal | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, taskId: number | null }>({ isOpen: false, taskId: null });
  const [view, setView] = useState<'tasks' | 'analytics' | 'calendar' | 'projects'>('tasks');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastUpdate = useMemo(() => Date.now(), [goals]);

  const progress = goals.length === 0 ? 0 : Math.round((goals.filter(g => g.done).length / goals.length) * 100);

  // --- HÀM XỬ LÝ MODE ---
  const handleRequestStrictMode = (taskId: number) => {
    setConfirmModal({ isOpen: true, taskId: taskId });
  };

  const confirmStrictMode = async () => {
    const taskId = confirmModal.taskId;
    if (!taskId) return;
    updateGoalMode(taskId, 'strict');
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
    fetchGoals(newDate);
  };

  const toggleTheme = () => { const m = !darkMode; setDarkMode(m); localStorage.setItem("theme", m ? "dark" : "light"); };

  // Auto-Refresh Date at midnight (Stale Date Fix)
  useEffect(() => {
    const checkDate = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
        fetchGoals(now);
        toast("Đã sang ngày mới! 🌅", { icon: '📅' });
      }
    }, 60000); // Check every minute
    return () => clearInterval(checkDate);
  }, [currentDate, fetchGoals]);

  useEffect(() => {
    const timer = setTimeout(() => { if (!quote) setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]); }, 0);
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchGoals(new Date()); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) fetchGoals(new Date()); else setGoals([]); });
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, [fetchGoals, quote, setLoading, setGoals]);


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
                    doneCount={goals.filter(g => g.done).length}
                    totalCount={goals.length}
                  />

                  {/* Routine Actions */}
                  {/* Routine Actions Toolbar */}
                  <div className="flex items-center justify-end gap-2 mb-4 bg-white dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-auto pl-3">Quick Actions</span>

                    <button
                      onClick={() => syncRoutine(currentDate)}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ⚡ Sync Routine
                    </button>
                    <button
                      onClick={() => setRecurringModalOpen(true)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ⚙️ Cài đặt
                    </button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <button
                      onClick={() => setProjectPickerOpen(true)}
                      className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      📂 Lấy từ Dự án
                    </button>
                  </div>

                  <TaskList
                    loading={loading}
                    goals={goals}
                    handleAddTask={(type) => addGoal(type, currentDate)}
                    toggleDone={toggleGoalDone}
                    handleUpdateField={updateGoalField}
                    handleDeleteTask={deleteGoal}
                    setFocusTask={setFocusTask}
                    handleRequestStrictMode={handleRequestStrictMode}
                    onReorder={reorderGoals}
                  />
                </>
              )}

              {view === 'analytics' && <Analytics goals={goals} />}

              {view === 'calendar' && (
                <CalendarView
                  currentDate={currentDate}
                  onSelectDate={(date: Date) => {
                    setCurrentDate(date);
                    fetchGoals(date);
                    setView('tasks');
                  }}
                  lastUpdate={lastUpdate} // Trigger refresh on render since goals change re-renders parent
                />
              )}

              {view === 'projects' && <ProjectManager />}

            </div>

          </div>



          {/* MOBILE NAVIGATION */}
          <MobileNav view={view} setView={setView} />

        </main>
      )
      }

      {/* Modals */}
      <RecurringModal
        isOpen={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
      />

      {/* Project Picker Modal */}
      <ProjectPickerModal
        isOpen={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        currentDate={currentDate}
        onTaskMoved={() => {
          setProjectPickerOpen(false);
          fetchGoals(currentDate); // Refresh today's list
        }}
      />

      {/* Pomodoro Modal */}
      {
        focusTask && (
          <PomodoroModal
            task={focusTask}
            onClose={() => setFocusTask(null)}
            onUpdateSession={(id: number, sessions: number) => updateGoalField(id, 'completed_sessions', sessions)}
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