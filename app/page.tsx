"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import confetti from "canvas-confetti";

interface Goal {
  id: number;
  text: string;
  done: boolean;
  target_date: string;
}

const QUOTES = [
  "Không làm mà đòi có ăn thì... đi ngủ đi!",
  "Hôm nay không đi thì ngày mai phải chạy.",
  "Kỷ luật là tự do.",
  "Code đi đừng sợ, Bug thì fix!",
  "Thất bại là mẹ thành công, nhưng đừng để mẹ đẻ nhiều quá."
];

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [quote, setQuote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // State giao diện
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Tính toán tiến độ
  const completedCount = goals.filter(g => g.done).length;
  const totalCount = goals.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const formatDateForDB = (dateObj: Date) => dateObj.toISOString().split('T')[0];
  const formatDateDisplay = (dateObj: Date) => dateObj.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchGoals = useCallback(async (dateObj: Date) => {
    setLoading(true);
    const dateStr = formatDateForDB(dateObj);
    const { data, error } = await supabase.from('goals').select('*').eq('target_date', dateStr).order('id', { ascending: true });

    if (error) console.error("Error fetching goals:", error);

    const isToday = dateStr === formatDateForDB(new Date());
    if ((!data || data.length === 0) && isToday) {
      const initialGoals = [{ text: "", target_date: dateStr }, { text: "", target_date: dateStr }, { text: "", target_date: dateStr }];
      const { data: newData } = await supabase.from('goals').insert(initialGoals).select();
      setGoals((newData as Goal[]) || []);
    } else {
      setGoals((data as Goal[]) || []);
    }
    setLoading(false);
  }, []);

  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 3 * 1000;
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        shapes: ['circle', 'square'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        shapes: ['circle', 'square'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  useEffect(() => {
    // 1. Load theme từ Local Storage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);

    // 2. Setup dữ liệu
    // Sử dụng setTimeout để tránh lỗi "Calling setState synchronously within an effect"
    const timer = setTimeout(() => {
      if (!quote) setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, 0);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchGoals(new Date());
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchGoals(new Date());
      else setGoals([]);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [fetchGoals, quote]);

  // Hàm bật tắt Dark Mode
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  useEffect(() => {
    if (goals.length > 0 && progress === 100 && !loading) {
      triggerConfetti();
    }
  }, [goals, progress, loading, triggerConfetti]);



  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    fetchGoals(newDate);
  };



  const toggleDone = async (id: number, currentStatus: boolean) => {
    const newGoals = goals.map((g) => (g.id === id ? { ...g, done: !currentStatus } : g));
    setGoals(newGoals);
    await supabase.from('goals').update({ done: !currentStatus }).eq('id', id);
  };

  const handleTextSave = async (id: number, newText: string) => {
    await supabase.from('goals').update({ text: newText }).eq('id', id);
  };

  const handleInputChange = (id: number, value: string) => {
    const newGoals = goals.map((g) => (g.id === id ? { ...g, text: value } : g));
    setGoals(newGoals);
  };

  const handleLogin = async () => { await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}/auth/callback` } }); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // --- Wrapper để kích hoạt Class Dark Mode ---
  return (
    <div className={darkMode ? "dark" : ""}>

      {/* Màn hình Login */}
      {!session ? (
        <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-white/20">
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Life OS ✨</h1>
            <button onClick={handleLogin} className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 mt-4 transition-all">
              Kết nối GitHub
            </button>
          </div>
        </main>
      ) : (

        /* Màn hình Chính */
        <main className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500
          bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100 
          dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">

          {/* Card chính - Responsive: w-[95%] cho mobile, md:max-w-md cho PC */}
          <div className="w-[95%] md:max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 relative overflow-hidden transition-all duration-300
            p-6 md:p-8">

            {/* Header Controls */}
            <div className="flex justify-between items-center absolute top-4 left-4 right-4 z-10">
              {/* Nút Theme */}
              <button onClick={toggleTheme} className="text-xl p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                {darkMode ? "🌙" : "☀️"}
              </button>
              {/* Nút Logout */}
              <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                EXIT
              </button>
            </div>

            {/* Title & Date Nav */}
            <div className="mb-8 text-center mt-6">
              <p className="text-indigo-500 dark:text-indigo-400 text-xs uppercase tracking-[0.2em] font-bold mb-1">
                {session.user.user_metadata.full_name || "Captain"}
              </p>

              <div className="flex items-center justify-center gap-4">
                <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition">←</button>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white capitalize w-48 truncate">
                  {formatDateDisplay(currentDate)}
                </h1>
                <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition">→</button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Tiến độ</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-pink-500 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-sm italic text-center">
              &quot;{quote}&quot;
            </div>

            {/* Goals List */}
            {loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : (
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center text-slate-400 italic py-8">Trống trơn... như ví tiền cuối tháng! 💸</div>
                ) : (
                  goals.map((goal, index) => (
                    <div key={goal.id} className="group flex items-center gap-3 bg-white dark:bg-slate-700/50 p-3 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300">

                      {/* Checkbox */}
                      <button
                        onClick={() => toggleDone(goal.id, goal.done)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                          ${goal.done ? "bg-green-500 border-green-500 rotate-0" : "border-slate-300 dark:border-slate-500 hover:border-indigo-400 rotate-0"}`}
                      >
                        {goal.done && <span className="text-white font-bold text-[10px]">✓</span>}
                      </button>

                      {/* Input */}
                      <input
                        type="text"
                        placeholder={`Mục tiêu #${index + 1}`}
                        value={goal.text || ""}
                        onChange={(e) => handleInputChange(goal.id, e.target.value)}
                        onBlur={(e) => handleTextSave(goal.id, e.target.value)}
                        className={`flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-100 font-medium placeholder:text-slate-300 dark:placeholder:text-slate-500 transition-all
                          ${goal.done ? "line-through text-slate-300 dark:text-slate-500" : ""}`}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}