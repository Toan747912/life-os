// components/ProgressBar.js
export default function ProgressBar({ progress }) {
    return (
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
    );
}