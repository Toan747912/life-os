import { useCallback } from 'react';

type SoundType = 'complete' | 'delete' | 'timer-finish' | 'click' | 'level-up';

export const useSound = () => {
    const playSound = useCallback((type: SoundType) => {
        // Chỉ chạy ở client-side
        if (typeof window === 'undefined') return;

        const sounds: Record<SoundType, string> = {
            'complete': '/sounds/complete.mp3',
            'delete': '/sounds/delete.mp3',
            'timer-finish': '/sounds/timer.mp3',
            'click': '/sounds/complete.mp3', // Fallback to complete sound for now
            'level-up': '/sounds/complete.mp3', // Fallback
        };

        const audioFile = sounds[type];
        if (!audioFile) return;

        const audio = new Audio(audioFile);

        // Tùy chỉnh volume cho từng loại nếu cần
        if (type === 'timer-finish') {
            audio.volume = 0.8; // Chuông báo cần to hơn
        } else {
            audio.volume = 0.5; // Hiệu ứng UI vừa phải
        }

        // Play và catch lỗi (ví dụ: trình duyệt chặn autoplay khi chưa tương tác)
        audio.play().catch((error) => console.warn("Không thể phát âm thanh:", error));
    }, []);

    return { playSound };
};