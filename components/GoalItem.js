import React, { useState, useEffect } from "react"; // <--- Thêm useState, useEffect
import { Trash2, Flag, Timer, Briefcase, Heart, Home, Layers, Circle, CheckCircle2, Lock, BrainCircuit, ShieldAlert, Feather, Ban, Clock, GripVertical, Sparkles } from "lucide-react";
import toast from 'react-hot-toast';

// ... (Giữ nguyên CONST CATEGORIES, PRIORITIES)
const CATEGORIES = {
    work: { color: "text-blue-500", icon: Briefcase, label: "Công việc" },
    health: { color: "text-red-500", icon: Heart, label: "Sức khỏe" },
    life: { color: "text-green-500", icon: Home, label: "Đời sống" },
    other: { color: "text-slate-400", icon: Layers, label: "Khác" },
};
const PRIORITIES = {
    3: { color: "text-red-600", fill: "fill-red-600", label: "Gấp" },
    2: { color: "text-amber-500", fill: "fill-amber-500", label: "Vừa" },
    1: { color: "text-slate-300", fill: "fill-none", label: "Thấp" },
};

export default function GoalItem({ goal, index, onToggle, onChange, onSave, onDelete, onUpdateField, onFocus, onRequestStrictMode, dragHandleProps }) {
    const CurrentIcon = CATEGORIES[goal.category || 'other'].icon;
    const focusSpan = goal.focus_span || 25;
    const estimatedMin = goal.estimated_minutes || 0;

    // --- FIX LAG: TẠO BIẾN CỤC BỘ ĐỂ GÕ CHO MƯỢT ---
    const [localMinutes, setLocalMinutes] = useState(estimatedMin);

    // Đồng bộ: Nếu dữ liệu từ DB thay đổi (ví dụ mới load trang), cập nhật vào biến cục bộ
    useEffect(() => {
        setLocalMinutes(estimatedMin);
    }, [estimatedMin]);

    const totalSessions = estimatedMin ? Math.ceil(estimatedMin / focusSpan) : 0;
    const completedSessions = goal.completed_sessions || 0;
    const currentMode = goal.mode || 'normal';
    const isStrict = currentMode === 'strict';
    const isLocked = isStrict && !goal.done;

    // --- LOGIC MỚI: CHỈ LƯU KHI RỜI KHỎI Ô INPUT (ON BLUR) ---
    const handleBlurMinutes = () => {
        // Nếu giá trị không đổi thì thôi, đỡ gọi DB
        if (localMinutes == estimatedMin) return;

        const val = parseInt(localMinutes) || 0;

        // 1. Lưu vào DB
        onUpdateField(goal.id, 'estimated_minutes', val);

        // 2. Logic Auto-Sync (Tự chỉnh Focus Span)
        if (val > 0 && val < 25) {
            onUpdateField(goal.id, 'focus_span', val);
            toast("Đã tự chỉnh thời gian tập trung ⚡", { icon: '🤖' });
        }
        else if (val >= 25 && focusSpan < 25) {
            onUpdateField(goal.id, 'focus_span', 25);
        }
    };

    const handleCheckboxClick = () => {
        if (isLocked) return;
        if (goal.done) {
            if (!window.confirm("Xác nhận: Bạn muốn đánh dấu công việc này là CHƯA XONG?")) return;
        }
        onToggle(goal.id, goal.done);
    };

    const handleModeClick = () => {
        if (isStrict) return;
        if (!estimatedMin || estimatedMin <= 0) {
            toast.error("Vui lòng nhập Thời gian dự kiến trước!", { style: { border: '1px solid #EF4444', color: '#B91C1C' } });
            return;
        }
        onRequestStrictMode(goal.id);
    };

    // --- FIX LAG & VALIDATION: Local state cho Text ---
    const [localText, setLocalText] = useState(goal.text || "");

    useEffect(() => {
        setLocalText(goal.text || "");
    }, [goal.text]);

    const handleBlurText = () => {
        const val = localText.trim();
        if (!val) {
            toast.error("Tên công việc không được để trống!", { id: 'empty-task' });
            setLocalText(goal.text || ""); // Revert to old text
            return;
        }
        if (val !== goal.text) {
            onSave(goal.id, val);
        }
    };

    // LOGIC PHÂN LOẠI MỚI
    const isFocusTask = goal.type === 'study' || goal.type === 'project_task';

    // ----------------------------------------------------------------------
    // TRƯỜNG HỢP 1: VIỆC VẶT (ROUTINE / CHORES)
    // ----------------------------------------------------------------------
    if (!isFocusTask) {
        return (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all group">
                {/* Drag Handle */}
                {dragHandleProps && (
                    <button
                        title="Kéo để sắp xếp lại thứ tự"
                        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
                        {...dragHandleProps}
                    >
                        <GripVertical size={16} />
                    </button>
                )}

                {/* Nút Checkbox đơn giản */}
                <button
                    onClick={handleCheckboxClick}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${goal.done ? "bg-slate-400 border-slate-400" : "border-slate-300 hover:border-indigo-400"}`}
                >
                    {goal.done && <span className="text-white font-bold text-[10px]">✓</span>}
                </button>

                {/* Input Text */}
                <input
                    type="text"
                    value={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    onBlur={handleBlurText}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlurText()}
                    className={`flex-1 bg-transparent outline-none text-sm font-medium ${goal.done ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-300"}`}
                />

                {/* Nút Xóa (Chỉ hiện khi hover) */}
                <button onClick={() => onDelete(goal.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                </button>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // TRƯỜNG HỢP 2: CÔNG VIỆC CẦN TẬP TRUNG (PROJECT / STUDY)
    // ----------------------------------------------------------------------
    return (
        <div className={`group flex flex-col gap-2 bg-white dark:bg-slate-800/80 p-3 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden
      ${goal.done ? "border-green-500 opacity-60" : "border-indigo-500"}
      ${isStrict ? "border-red-500 bg-red-50/10" : ""} 
    `}>
            {/* HIỂN THỊ TÊN DỰ ÁN (Nếu có) */}
            {goal.type === 'project_task' && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <Briefcase size={10} />
                    PROJECT TASK
                </div>
            )}

            {isStrict && !goal.done && (
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                    <ShieldAlert size={100} className="text-red-500" />
                </div>
            )}

            {/* HÀNG 1 */}
            <div className="flex items-center gap-3 z-10">
                {/* Drag Handle - Chỉ hiện nếu có props */}
                {dragHandleProps && (
                    <button
                        title="Kéo để sắp xếp lại thứ tự"
                        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
                        {...dragHandleProps}
                    >
                        <GripVertical size={16} />
                    </button>
                )}

                <button
                    title={isLocked ? "Bị khóa trong chế độ Strict Mode" : (goal.done ? "Đánh dấu chưa xong" : "Đánh dấu đã xong")}
                    disabled={isLocked}
                    onClick={handleCheckboxClick}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
            ${goal.done
                            ? "bg-green-500 border-green-500"
                            : isLocked
                                ? "border-red-200 bg-red-100 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-500 hover:border-indigo-400"
                        }`}
                >
                    {goal.done && <span className="text-white font-bold text-[8px]">✓</span>}
                    {!goal.done && isLocked && <Lock size={10} className="text-red-500" />}
                </button>

                <input
                    type="text"
                    value={localText}
                    readOnly={isStrict}
                    onChange={(e) => setLocalText(e.target.value)}
                    onBlur={handleBlurText}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlurText()}
                    placeholder="Nhập tên công việc..."
                    title={isStrict ? "Không thể sửa tên khi đang trong Strict Mode" : localText}
                    className={`flex-1 bg-transparent outline-none font-medium transition-all truncate
            ${goal.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-100"}
            ${isStrict ? "cursor-not-allowed text-slate-500 select-none" : ""} 
          `}
                />

                <button
                    title={isStrict ? "Không thể xóa khi đang trong Strict Mode" : "Xóa công việc này"}
                    onClick={() => !isStrict && onDelete(goal.id)}
                    disabled={isStrict}
                    className={`transition-opacity opacity-0 group-hover:opacity-100
            ${isStrict ? "text-slate-300 cursor-not-allowed" : "text-slate-300 hover:text-red-500"}`}
                >
                    {isStrict ? <Ban size={16} /> : <Trash2 size={16} />}
                </button>
            </div>

            {/* HÀNG 2 */}
            {
                !goal.done && (
                    <div className="flex flex-wrap items-center justify-between pl-8 pr-1 mt-1 gap-2 z-10">
                        <div className={`flex gap-2 items-center ${isStrict ? "opacity-60 pointer-events-none grayscale" : ""}`}>

                            <button
                                title={isStrict ? "Đang ở chế độ Nghiêm khắc (Không thể tắt)" : "Bật chế độ Nghiêm khắc (Khóa sửa/xóa)"}
                                disabled={isStrict}
                                onClick={handleModeClick}
                                className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1.5 rounded-md transition-all border
                  ${isStrict
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600"}`}
                            >
                                {isStrict ? <ShieldAlert size={12} /> : <Feather size={12} />}
                                {isStrict ? "STRICT" : "NORMAL"}
                            </button>

                            <button
                                title={`Danh mục: ${CATEGORIES[goal.category || 'other'].label}. Nhấp để đổi.`}
                                disabled={isStrict}
                                onClick={() => {
                                    const keys = Object.keys(CATEGORIES);
                                    const nextCat = keys[(keys.indexOf(goal.category || 'other') + 1) % keys.length];
                                    onUpdateField(goal.id, 'category', nextCat);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-transparent hover:border-slate-200 transition-all
                                ${CATEGORIES[goal.category || 'other'].color} bg-slate-50 dark:bg-slate-700`}
                            >
                                <CurrentIcon size={14} />
                                <span className="text-[10px] font-bold uppercase">{CATEGORIES[goal.category || 'other'].label}</span>
                            </button>

                            <button
                                title={`Độ ưu tiên: ${PRIORITIES[goal.priority || 1].label}. Nhấp để đổi.`}
                                disabled={isStrict}
                                onClick={() => onUpdateField(goal.id, 'priority', (goal.priority === 3 ? 1 : (goal.priority || 1) + 1))}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 transition-all"
                            >
                                <Flag size={14} className={`${PRIORITIES[goal.priority || 1].color} ${PRIORITIES[goal.priority || 1].fill}`} />
                                <span className={`text-[10px] font-bold uppercase ${PRIORITIES[goal.priority || 1].color}`}>
                                    {PRIORITIES[goal.priority || 1].label}
                                </span>
                            </button>

                            <div className="flex items-center gap-2">

                                {/* 1. Ô NHẬP TỔNG THỜI GIAN (ĐÃ FIX LAG) */}
                                <div
                                    title="Tổng thời gian dự kiến (phút)"
                                    className={`flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 shadow-sm transition-colors
                    ${!estimatedMin ? "border-indigo-300 ring-1 ring-indigo-100" : ""}
                `}>
                                    <Clock size={12} className="text-slate-400 mr-1.5" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400 font-bold leading-none">DỰ KIẾN</span>
                                        <div className="flex items-baseline">
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={isStrict}
                                                className="w-8 bg-transparent text-xs font-bold text-indigo-600 dark:text-white outline-none p-0"
                                                placeholder="0"

                                                // A. Chỉ update biến local khi gõ (Siêu nhanh, không lag)
                                                value={localMinutes}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (parseInt(val) < 0) return; // Block negative
                                                    setLocalMinutes(val);
                                                }}

                                                // B. Chỉ update DB khi click ra ngoài hoặc Enter
                                                onBlur={handleBlurMinutes}
                                                onKeyDown={(e) => e.key === 'Enter' && handleBlurMinutes()}
                                            />
                                            <span className="text-[9px] text-slate-500">phút</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Ô CHỌN FOCUS SPAN */}
                                <div
                                    title="Thời gian cho mỗi phiên tập trung (Pomodoro)"
                                    className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 shadow-sm"
                                >
                                    <BrainCircuit size={12} className="text-slate-400 mr-1.5" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400 font-bold leading-none">PHIÊN</span>
                                        <select
                                            disabled={isStrict}
                                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none cursor-pointer p-0 w-16"
                                            value={goal.focus_span || 25}
                                            onChange={(e) => onUpdateField(goal.id, 'focus_span', parseInt(e.target.value))}
                                        >
                                            {estimatedMin > 0 && estimatedMin < 25 && (
                                                <option value={estimatedMin}>{estimatedMin}p (Auto)</option>
                                            )}
                                            <option value="25">25p /phiên</option>
                                            <option value="45">45p /phiên</option>
                                            <option value="60">60p /phiên</option>
                                            <option value="90">90p /phiên</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {totalSessions > 0 && (
                            <div className="flex flex-col ml-2 items-end">
                                {/* Dòng 1: Các chấm tròn */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalSessions }).map((_, i) => {
                                        const isLast = i === totalSessions - 1;
                                        const remainder = estimatedMin % focusSpan;
                                        const sessionDuration = (isLast && remainder > 0) ? remainder : focusSpan;

                                        return (
                                            <div key={i} title={`Phiên ${i + 1}: ${sessionDuration} phút`}>
                                                {i < completedSessions ? (
                                                    <CheckCircle2 size={12} className="text-green-500" />
                                                ) : (
                                                    <Circle
                                                        size={12}
                                                        className={`text-slate-300 dark:text-slate-600 ${isLast && remainder > 0 ? "opacity-50" : ""}`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Dòng 2: Text chi tiết (Logic chính xác) */}
                                <span className="text-[9px] text-slate-400 font-medium leading-none mt-1">
                                    {(() => {
                                        const fullSessions = Math.floor(estimatedMin / focusSpan);
                                        const remainder = estimatedMin % focusSpan;
                                        if (remainder === 0) return `${fullSessions} x ${focusSpan}p = ${estimatedMin}p`;
                                        return `${fullSessions} x ${focusSpan}p + ${remainder}p = ${estimatedMin}p`;
                                    })()}
                                </span>
                            </div>
                        )}

                        <div className="relative group/ai">
                            <button
                                title="AI Break Down (Tính năng thử nghiệm)"
                                onClick={() => {
                                    toast("🧙‍♂️ AI đang suy nghĩ...", { icon: '🔮' });
                                    setTimeout(() => {
                                        toast.success("Đã tìm thấy 3 bước nhỏ hơn! (Mock)", { duration: 4000 });
                                    }, 1500);
                                }}
                                className="bg-purple-100 text-purple-600 p-1.5 rounded-full hover:bg-purple-200 transition-colors mr-2"
                            >
                                <Sparkles size={14} />
                            </button>
                        </div>

                        <button
                            title="Bắt đầu phiên tập trung ngay"
                            onClick={() => onFocus(goal)}
                            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ml-auto transition-all shadow-sm
                ${isStrict
                                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 animate-pulse"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"}`}
                        >
                            <Timer size={14} /> {isStrict ? "FOCUS" : "Start"}
                        </button>
                    </div>
                )
            }
        </div >
    );
}