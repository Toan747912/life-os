"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";

interface Goal {
  id: number;
  text: string;
  done: boolean;
  created_at?: string;
}

const QUOTES = [
  "Không làm mà đòi có ăn thì... đi ngủ đi!",
  "Hôm nay không đi thì ngày mai phải chạy.",
  "Kỷ luật là tự do.",
  "Code đi đừng sợ, Bug thì fix!",
];

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Initialize state with stable empty values to match server render
  const [date, setDate] = useState("");
  const [quote, setQuote] = useState("");

  // Update date and quote on client-side mount only
  useEffect(() => {
    const today = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(today.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('goals').select('*').order('id', { ascending: true });

    if (error) console.log("Lỗi tải data:", error);

    // Nếu chưa có goal nào, tạo mẫu 3 cái
    if (!data || data.length === 0) {
      const initialGoals = [{ text: "" }, { text: "" }, { text: "" }];
      const { data: newData, error: insertError } = await supabase.from('goals').insert(initialGoals).select();
      if (insertError) console.log("Lỗi tạo mới:", insertError);
      setGoals((newData as Goal[]) || []);
    } else {
      setGoals(data as Goal[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // 2. Kiểm tra xem đã đăng nhập chưa?
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchGoals(); // Nếu rồi thì lấy data
      else setLoading(false);
    });

    // Lắng nghe sự kiện đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchGoals();
      else setGoals([]); // Đăng xuất thì xóa data trên màn hình
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hàm đăng nhập bằng GitHub
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`, // Quay về trang chủ sau khi login
      }
    });
  };

  // Hàm đăng xuất
  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  // --- GIAO DIỆN ---
  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-2">Life OS 🚀</h1>
          <p className="text-slate-500 mb-6">Quản lý cuộc đời, bắt đầu từ hôm nay.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <span>🐙</span> Đăng nhập với GitHub
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative">

        {/* Nút Logout nhỏ góc trên */}
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-600 underline">
          Đăng xuất
        </button>

        <div className="mb-6 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Xin chào, {session.user.user_metadata.full_name || "Bạn tôi"}</p>
          <h1 suppressHydrationWarning className="text-2xl font-bold text-slate-800 mt-2 capitalize">{date}</h1>
        </div>

        <div suppressHydrationWarning className="mb-8 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r text-slate-600 italic text-sm">
          &quot;{quote}&quot;
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Đang tải dữ liệu của bạn...</div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div key={goal.id} className="group flex items-center gap-3">
                <button
                  onClick={() => toggleDone(goal.id, goal.done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                    ${goal.done ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-green-400"}`}
                >
                  {goal.done && <span className="text-white text-xs">✓</span>}
                </button>

                <input
                  type="text"
                  placeholder={`Mục tiêu #${index + 1}`}
                  value={goal.text || ""}
                  onChange={(e) => handleInputChange(goal.id, e.target.value)}
                  onBlur={(e) => handleTextSave(goal.id, e.target.value)}
                  className={`flex-1 bg-transparent border-b-2 border-slate-100 py-2 outline-none text-slate-700 placeholder:text-slate-300 transition-all focus:border-blue-400
                    ${goal.done ? "line-through text-slate-400" : ""}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}