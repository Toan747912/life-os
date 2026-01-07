"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import confetti from "canvas-confetti"; // Import pháo hoa

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

  // Tính toán tiến độ (0 -> 100%)
  const completedCount = goals.filter(g => g.done).length;
  const totalCount = goals.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  useEffect(() => {
    // Sử dụng setTimeout để tránh lỗi "Calling setState synchronously within an effect"
    const timer = setTimeout(() => {
      if (!quote) {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [quote]);

  useEffect(() => {
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
    return () => subscription.unsubscribe();
  }, [fetchGoals]);

  // Hiệu ứng pháo hoa khi hoàn thành 100%
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

  // --- GIAO DIỆN LOGIN ---
  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-white/20">
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Life OS ✨</h1>
          <p className="text-slate-500 mb-6">Thiết kế cuộc đời ngoại hạng.</p>
          <button onClick={handleLogin} className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Kết nối GitHub
          </button>
        </div>
      </main>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 font-sans">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">

        {/* Nút Logout */}
        <button onClick={handleLogout} className="absolute top-5 right-5 text-xs font-bold text-slate-300 hover:text-red-500 transition-colors z-10">
          EXIT
        </button>

        {/* Header */}
        <div className="mb-8 text-center relative z-10">
          <p className="text-indigo-500 text-xs uppercase tracking-[0.2em] font-bold mb-1">
            {session.user.user_metadata.full_name || "Captain"}
          </p>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition">←</button>
            <h1 className="text-xl font-extrabold text-slate-800 capitalize w-48 truncate">
              {formatDateDisplay(currentDate)}
            </h1>
            <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition">→</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Tiến độ ngày</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-pink-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Quote */}
        <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-800 text-sm italic text-center">
          &quot;{quote}&quot;
        </div>

        {/* Goal List */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center text-slate-400 italic py-8">Trống trơn... như ví tiền cuối tháng! 💸</div>
            ) : (
              goals.map((goal, index) => (
                <div key={goal.id} className="group flex items-center gap-3 bg-white p-2 rounded-xl border border-transparent hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                  <button
                    onClick={() => toggleDone(goal.id, goal.done)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 transform active:scale-90
                      ${goal.done ? "bg-green-500 border-green-500 rotate-0" : "border-slate-200 hover:border-indigo-400 rotate-0"}`}
                  >
                    {goal.done && <span className="text-white font-bold text-sm">✓</span>}
                  </button>
                  <input
                    type="text"
                    placeholder={`Mục tiêu #${index + 1}`}
                    value={goal.text || ""}
                    onChange={(e) => handleInputChange(goal.id, e.target.value)}
                    onBlur={(e) => handleTextSave(goal.id, e.target.value)}
                    className={`flex-1 bg-transparent py-2 outline-none text-slate-700 font-medium placeholder:text-slate-300 placeholder:font-normal transition-all
                      ${goal.done ? "line-through text-slate-300" : ""}`}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main >
  );
}