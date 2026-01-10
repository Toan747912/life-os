import React from "react";
import { ShieldAlert } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-red-500 animate-bounce-in">

        <div className="flex justify-center mb-4 text-red-500">
          <ShieldAlert size={48} />
        </div>

        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">
          Bật chế độ Nghiêm Khắc?
        </h2>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6">
          <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-2 font-medium">
            <li>Bạn <b>KHÔNG THỂ</b> quay lại chế độ thường.</li>
            <li>Nút hoàn thành sẽ bị <b>KHÓA</b>.</li>
            <li>Cách duy nhất để xong là <b>chạy hết đồng hồ</b>.</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Thôi, sợ lắm
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition"
          >
            Chấp nhận!
          </button>
        </div>

      </div>
    </div>
  );
}