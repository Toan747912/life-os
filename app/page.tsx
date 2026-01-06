"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase"; // Import cái file kết nối nãy mới tạo

interface Goal {
  id: number;
  text: string;
  done: boolean;
  created_at?: string;
}

// Danh sách câu nói "bá đạo"
const QUOTES = [
  "Không làm mà đòi có ăn thì... đi ngủ đi!",
  "Hôm nay không đi thì ngày mai phải chạy.",
  "Kỷ luật là tự do.",
  "Đừng để ngày mai là một phiên bản lười biếng của hôm nay.",
  "Code đi đừng sợ, Bug thì fix!",
  "Thất bại là mẹ thành công, nhưng đừng để mẹ đẻ nhiều quá."
];

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]); // Bắt đầu là mảng rỗng

  // Initialize state directly to avoid useEffect setState warning
  const [date] = useState(() => {
    if (typeof window === 'undefined') return ""; // Server side
    const today = new Date();
    return today.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });

  const [quote] = useState(() => {
    // Random quote can cause hydration mismatch, handled by suppressHydrationWarning below
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  });

  const [loading, setLoading] = useState(true); // Trạng thái đang tải

  // 1. Chạy khi App vừa mở lên
  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('id', { ascending: true });

      if (error) console.log("Lỗi tải data:", error);

      // Nếu Database chưa có gì (lần đầu dùng), tự tạo 3 dòng trống
      if (!data || data.length === 0) {
        const initialGoals = [{ text: "" }, { text: "" }, { text: "" }];
        const { data: newData } = await supabase.from('goals').insert(initialGoals).select();
        if (newData) {
          // Cast data safely
          setGoals(newData as Goal[]);
        }
      } else {
        setGoals(data as Goal[]);
      }
      setLoading(false);
    };

    fetchGoals();
  }, []);

  // Hàm cập nhật trạng thái Hoàn thành (Tick xanh)
  const toggleDone = async (id: number, currentStatus: boolean) => {
    // 1. Cập nhật giao diện ngay cho mượt (Optimistic UI)
    const newGoals = goals.map((g) => (g.id === id ? { ...g, done: !currentStatus } : g));
    setGoals(newGoals);

    // 2. Gửi lên Server lưu
    await supabase.from('goals').update({ done: !currentStatus }).eq('id', id);
  };

  // Hàm cập nhật nội dung (Chỉ lưu khi gõ xong - onBlur)
  const handleTextSave = async (id: number, newText: string) => {
    await supabase.from('goals').update({ text: newText }).eq('id', id);
  };

  // Hàm xử lý khi đang gõ (chỉ cập nhật giao diện local để gõ cho nhanh)
  const handleInputChange = (id: number, value: string) => {
    const newGoals = goals.map((g) => (g.id === id ? { ...g, text: value } : g));
    setGoals(newGoals);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">

        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Hôm nay là</p>
          <h1 suppressHydrationWarning className="text-2xl font-bold text-slate-800 mt-2 capitalize">{date}</h1>
        </div>

        {/* Quote */}
        <div suppressHydrationWarning className="mb-8 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r text-slate-600 italic text-sm">
          &quot;{quote}&quot;
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-slate-400 py-10">Đang tải mục tiêu...</div>
        ) : (
          /* Danh sách mục tiêu */
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div key={goal.id} className="group flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => goal.id && toggleDone(goal.id, !!goal.done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                    ${goal.done ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-green-400"}`}
                >
                  {goal.done && <span className="text-white text-xs">✓</span>}
                </button>

                {/* Input Text */}
                <input
                  type="text"
                  placeholder={`Mục tiêu #${index + 1}`}
                  value={goal.text || ""}
                  onChange={(e) => goal.id && handleInputChange(goal.id, e.target.value)} // Cập nhật state
                  onBlur={(e) => goal.id && handleTextSave(goal.id, e.target.value)}     // Lưu lên DB khi click ra ngoài
                  className={`flex-1 bg-transparent border-b-2 border-slate-100 py-2 outline-none text-slate-700 placeholder:text-slate-300 transition-all focus:border-blue-400
                    ${goal.done ? "line-through text-slate-400" : ""}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 italic">
            &quot;Dữ liệu đã được đồng bộ lên Mây ☁️&quot;
          </p>
        </div>
      </div>
    </main>
  );
}