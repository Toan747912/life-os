// components/QuoteBox.js
export default function QuoteBox({ quote }) {
    return (
        <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-sm italic text-center transition-colors">
            &quot;{quote}&quot;
        </div>
    );
}