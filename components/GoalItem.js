import React, { useState, useEffect, useRef } from "react";
import { Trash2, Flag, Timer, Briefcase, Heart, Home, Layers, Circle, CheckCircle2, Lock, BrainCircuit, ShieldAlert, Feather, Clock, GripVertical, Settings2, AlertCircle } from "lucide-react";
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

function GoalItem({ goal, onToggle, onSave, onDelete, onUpdateField, onFocus, onRequestStrictMode, dragHandleProps }) {
    const CurrentIcon = CATEGORIES[goal.category || 'other'].icon;
    const focusSpan = goal.focus_span || 25;
    const estimatedMin = goal.estimated_minutes || 0;

    // --- FIX LAG: TẠO BIẾN CỤC BỘ ĐỂ GÕ CHO MƯỢT ---
    const [localMinutes, setLocalMinutes] = useState(estimatedMin);

    // State cho hiệu ứng rung lắc khi bị chặn (Error Feedback)
    const [isShaking, setIsShaking] = useState(false);

    // Toggle cho Settings Menu
    const [showSettings, setShowSettings] = useState(false);

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

    // Hàm kích hoạt hiệu ứng rung
    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const handleCheckboxClick = () => {
        if (isLocked) { triggerShake(); return; }

        if (isOverdue && !goal.done) {
            triggerShake();
            toast.error("Task đã quá hạn! Hãy dời lịch nếu muốn hoàn thành.", { icon: '🚫' });
            return;
        }

        if (isFuture && !goal.done) {
            triggerShake();
            toast.error("Chưa đến ngày làm task này!", { icon: '⏳' });
            return;
        }

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

    // --- LOGIC TÍNH DEADLINE (DUE SOON) ---
    const getDueStatus = () => {
        if (!goal.target_date || goal.done) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(goal.target_date);
        // Fix múi giờ đơn giản: so sánh timestamp
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Quá hạn', color: 'text-red-600 bg-red-100 border-red-200', icon: AlertCircle };
        if (diffDays === 0) return { text: 'Hôm nay', color: 'text-indigo-600 bg-indigo-100 border-indigo-200', icon: Clock };
        if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, color: 'text-orange-600 bg-orange-100 border-orange-200', icon: AlertCircle };
        return null;
    };
    const dueStatus = getDueStatus();
    const isOverdue = dueStatus?.text === 'Quá hạn';

    // Logic check Tương lai (Future)
    const isFuture = (() => {
        if (!goal.target_date || goal.done) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(goal.target_date);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0;
    })();

    // --- SWIPE TO DELETE LOGIC ---
    const [swipeOffset, setSwipeOffset] = useState(0);
    const touchStartX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        const currentX = e.targetTouches[0].clientX;
        const diff = currentX - touchStartX.current;
        // Chỉ cho phép vuốt trái (diff < 0) và giới hạn visual (-200px)
        if (diff < 0 && diff > -200) {
            setSwipeOffset(diff);
        }
    };

    const handleTouchEnd = () => {
        if (swipeOffset < -100) {
            // Ngưỡng kích hoạt xóa
            if (window.confirm("Bạn có chắc muốn xóa công việc này?")) {
                onDelete(goal.id);
            }
        }
        setSwipeOffset(0);
    };

    // ----------------------------------------------------------------------
    // TRƯỜNG HỢP 1: VIỆC VẶT (ROUTINE / CHORES)
    // ----------------------------------------------------------------------
    if (!isFocusTask) {
        return (
            <div className="relative overflow-hidden rounded-xl">
                {/* Background Delete Layer */}
                <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl">
                    <Trash2 className="text-white animate-pulse" size={20} />
                </div>

                {/* Foreground Content */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                    }}
                    className="relative bg-white dark:bg-slate-800/60 flex items-center gap-3 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all group shadow-sm hover:shadow-md active:scale-[0.99] duration-200"
                >
                    {/* Drag Handle */}
                    {dragHandleProps && (
                        <button
                            title="Kéo để sắp xếp lại thứ tự"
                            className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none p-2 -ml-2"
                            {...dragHandleProps}
                        >
                            <GripVertical size={18} />
                        </button>
                    )}

                    {/* Nút Checkbox đơn giản */}
                    <button
                        onClick={handleCheckboxClick}
                        disabled={(isOverdue || isFuture) && !goal.done}
                        className={`w-6 h-6 md:w-5 md:h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isShaking ? 'animate-pulse ring-2 ring-red-400 border-red-400' : ''}
                    ${goal.done
                                ? "bg-slate-400 border-slate-400"
                                : ((isOverdue || isFuture) && !goal.done) ? "border-slate-200 bg-slate-100 cursor-not-allowed" : "border-slate-300 hover:border-violet-400"}`}
                    >
                        {goal.done && <span className="text-white font-bold text-xs">✓</span>}
                        {isOverdue && !goal.done && <span className="text-slate-300 font-bold text-[10px]">✕</span>}
                        {isFuture && !goal.done && <span className="text-slate-300 font-bold text-[10px]">⏳</span>}
                    </button>

                    {/* Input Text */}
                    <input
                        type="text"
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        onBlur={handleBlurText}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlurText()}
                        className={`flex-1 bg-transparent outline-none text-base md:text-sm font-medium py-1 ${goal.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}
                    />

                    {/* Due Date Badge (Routine) */}
                    {dueStatus && !goal.done && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${dueStatus.color}`}>
                            <dueStatus.icon size={10} />
                            <span>{dueStatus.text}</span>
                        </div>
                    )}

                    {/* Nút Xóa (Chỉ hiện khi hover trên Desktop, luôn hiện nút nhỏ trên Mobile nếu cần thiết kế lại, nhưng ở đây giữ hover cho clean, có thể vuốt để xóa sau này) */}
                    <button onClick={() => onDelete(goal.id)} className="text-slate-300 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // TRƯỜNG HỢP 2: CÔNG VIỆC CẦN TẬP TRUNG (PROJECT / STUDY)
    // ----------------------------------------------------------------------
    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background Delete Layer */}
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl">
                <Trash2 className="text-white animate-pulse" size={24} />
            </div>

            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                }}
                className={`group flex flex-col bg-white dark:bg-slate-800/80 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden
      ${goal.done ? "border-green-500 opacity-60" : (isOverdue ? "border-slate-300 opacity-75 bg-slate-50 dark:bg-slate-900" : "border-indigo-500")}
      ${isStrict ? "border-red-500 bg-red-50/10" : ""} 
    `}
            >
                {/* BACKGROUND PROGRESS BAR (Optional visual cue) */}
                {totalSessions > 0 && !goal.done && (
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-indigo-500/10 transition-all duration-500"
                        style={{ width: `${(completedSessions / totalSessions) * 100}%` }}
                    />
                )}

                {/* HEADER ROW: Checkbox, Text, Main Actions */}
                <div className="flex items-center gap-3 p-3 z-10 w-full">
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

                    {/* Checkbox */}
                    <button
                        title={isLocked ? "Bị khóa trong chế độ Strict Mode" : (isOverdue && !goal.done ? "Đã quá hạn" : (isFuture && !goal.done ? "Chưa đến ngày" : (goal.done ? "Đánh dấu chưa xong" : "Đánh dấu đã xong")))}
                        disabled={isLocked || ((isOverdue || isFuture) && !goal.done)}
                        onClick={handleCheckboxClick}
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isShaking ? 'animate-pulse ring-2 ring-red-400 border-red-400' : ''}
            ${goal.done
                                ? "bg-green-500 border-green-500"
                                : isLocked
                                    ? "border-red-200 bg-red-100 cursor-not-allowed"
                                    : ((isOverdue || isFuture) && !goal.done)
                                        ? "border-slate-200 bg-slate-100 cursor-not-allowed"
                                        : "border-slate-300 dark:border-slate-500 hover:border-indigo-400"
                            }`}
                    >
                        {goal.done && <span className="text-white font-bold text-[8px]">✓</span>}
                        {!goal.done && isLocked && <Lock size={10} className="text-red-500" />}
                        {!goal.done && isOverdue && <span className="text-slate-300 font-bold text-[8px]">✕</span>}
                        {!goal.done && isFuture && <span className="text-slate-300 font-bold text-[8px]">⏳</span>}
                    </button>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <input
                            type="text"
                            value={localText}
                            readOnly={isStrict}
                            onChange={(e) => setLocalText(e.target.value)}
                            onBlur={handleBlurText}
                            onKeyDown={(e) => e.key === 'Enter' && handleBlurText()}
                            className={`bg-transparent outline-none font-medium truncate w-full
                         ${goal.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-100"}
                         ${isStrict ? "cursor-not-allowed text-slate-500 select-none" : ""} 
                         `}
                        />

                        {/* Sub-info Line: Category & Priority (Visible only if NOT expanded, for quick glance) */}
                        {!showSettings && !goal.done && (
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${CATEGORIES[goal.category || 'other'].color}`}>
                                    <CurrentIcon size={10} />
                                    {CATEGORIES[goal.category || 'other'].label}
                                </div>
                                {goal.priority > 1 && (
                                    <div className={`flex items-center gap-0.5 text-[10px] font-bold uppercase ${(PRIORITIES[goal.priority] || PRIORITIES[1]).color}`}>
                                        <Flag size={10} />
                                        {(PRIORITIES[goal.priority] || PRIORITIES[1]).label}
                                    </div>
                                )}
                                {/* Small text for time if set */}
                                {estimatedMin > 0 && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-1">
                                        <Clock size={10} /> {completedSessions}/{totalSessions} phiên ({estimatedMin}p)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>


                    {/* RIGHT ACTIONS: Settings Toggle, Start Button */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Settings Toggle */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-1.5 rounded-md transition-all ${showSettings ? 'bg-slate-100 text-slate-600 dark:bg-slate-700' : 'text-slate-300 hover:text-slate-500'}`}
                            title="Cài đặt chi tiết"
                        >
                            <Settings2 size={16} />
                        </button>

                        {/* START / DELETE Action */}
                        {!goal.done && (
                            <button
                                title="Bắt đầu phiên tập trung ngay"
                                onClick={() => onFocus(goal)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all shadow-sm whitespace-nowrap
                            ${isStrict
                                        ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 animate-pulse"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"}`}
                            >
                                <Timer size={14} /> {isStrict ? "FOCUS" : "Start"}
                            </button>
                        )}

                        {goal.done && (
                            <button onClick={() => onDelete(goal.id)} className="text-slate-300 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* EXPANDABLE SETTINGS AREA */}
                {showSettings && !goal.done && (
                    <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* 1. Time & Sessions */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-1.5 border border-slate-100 dark:border-slate-700">
                                {/* Input Time */}
                                <div title="Tổng thời gian (phút)" className="flex items-center gap-1 px-1">
                                    <Clock size={14} className="text-slate-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        disabled={isStrict}
                                        className="w-10 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none text-right"
                                        placeholder="0"
                                        value={localMinutes}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (parseInt(val) < 0) return;
                                            setLocalMinutes(val);
                                        }}
                                        onBlur={handleBlurMinutes}
                                        onKeyDown={(e) => e.key === 'Enter' && handleBlurMinutes()}
                                    />
                                    <span className="text-xs text-slate-400">phút</span>
                                </div>

                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                                {/* Select Focus Span */}
                                <div title="Độ ưu tập trung (Pomodoro)" className="flex items-center gap-1 px-1">
                                    <BrainCircuit size={14} className="text-slate-400" />
                                    <select
                                        disabled={isStrict}
                                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                                        value={goal.focus_span || 25}
                                        onChange={(e) => onUpdateField(goal.id, 'focus_span', parseInt(e.target.value))}
                                    >
                                        {estimatedMin > 0 && estimatedMin < 25 && <option value={estimatedMin}>Auto</option>}
                                        <option value="25">25p</option>
                                        <option value="45">45p</option>
                                        <option value="60">60p</option>
                                    </select>
                                </div>
                            </div>

                            {/* 2. Category */}
                            <button
                                title="Đổi danh mục"
                                disabled={isStrict}
                                onClick={() => {
                                    const keys = Object.keys(CATEGORIES);
                                    const nextCat = keys[(keys.indexOf(goal.category || 'other') + 1) % keys.length];
                                    onUpdateField(goal.id, 'category', nextCat);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all ${CATEGORIES[goal.category || 'other'].color} bg-slate-50 dark:bg-slate-700`}
                            >
                                <CurrentIcon size={14} />
                                <span className="text-xs font-bold uppercase">{CATEGORIES[goal.category || 'other'].label}</span>
                            </button>

                            {/* 3. Priority */}
                            <button
                                title="Đổi độ ưu tiên"
                                disabled={isStrict}
                                onClick={() => onUpdateField(goal.id, 'priority', (goal.priority === 3 ? 1 : (goal.priority || 1) + 1))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 transition-all"
                            >
                                <Flag size={14} className={`${(PRIORITIES[goal.priority] || PRIORITIES[1]).color} ${(PRIORITIES[goal.priority] || PRIORITIES[1]).fill}`} />
                                <span className={`text-xs font-bold uppercase ${(PRIORITIES[goal.priority] || PRIORITIES[1]).color}`}>
                                    {(PRIORITIES[goal.priority] || PRIORITIES[1]).label}
                                </span>
                            </button>

                            {/* Due Date Badge (Expanded Settings) */}
                            {dueStatus && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${dueStatus.color}`}>
                                    <dueStatus.icon size={14} />
                                    <span className="text-xs font-bold uppercase">{dueStatus.text}</span>
                                </div>
                            )}

                            {/* 4. Strict Mode Toggle */}
                            <button
                                title={isStrict ? "Đang khóa chế độ" : "Bật chế độ Nghiêm khắc"}
                                disabled={isStrict}
                                onClick={handleModeClick}
                                className={`flex items-center gap-1 text-xs uppercase font-bold px-3 py-1.5 rounded-lg transition-all border ml-auto
                            ${isStrict
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-white text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"}`}
                            >
                                {isStrict ? <ShieldAlert size={14} /> : <Feather size={14} />}
                                {isStrict ? "STRICT ON" : "NORMAL"}
                            </button>

                            {/* 5. Delete Button (Inside Settings) */}
                            <button
                                title="Xóa công việc"
                                onClick={() => !isStrict && onDelete(goal.id)}
                                disabled={isStrict}
                                className={`p-1.5 text-slate-300 hover:text-red-500 transition-colors ${isStrict ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Visual Session Indicator (Expanded) */}
                        {totalSessions > 0 && (
                            <div className="mt-3 flex items-center gap-1 bg-slate-50/50 p-2 rounded-lg justify-center border border-slate-100 dark:border-slate-800">
                                {Array.from({ length: totalSessions }).map((_, i) => (
                                    <div key={i} title={`Phiên ${i + 1}`}>
                                        {i < completedSessions ? (
                                            <CheckCircle2 size={12} className="text-green-500" />
                                        ) : (
                                            <Circle size={12} className="text-slate-300 dark:text-slate-600" />
                                        )}
                                    </div>
                                ))}
                                <span className="text-[10px] text-slate-400 ml-2 font-bold">
                                    {completedSessions}/{totalSessions} phiên
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}

export default React.memo(GoalItem);