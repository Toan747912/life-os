import { useCallback } from 'react';

export const useSound = () => {
    const playSound = useCallback((type: 'complete' | 'level-up' | 'timer-finish') => {
        // Check if running in browser
        if (typeof window === 'undefined') return;

        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.volume = 0.5; // 50% volume

        audio.play().catch((err) => {
            console.warn(`Failed to play sound: ${type}`, err);
        });
    }, []);

    return { playSound };
};
