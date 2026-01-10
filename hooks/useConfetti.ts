import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export const useConfetti = () => {
    // Hiệu ứng pháo giấy đơn giản (cho task nhỏ)
    const triggerConfetti = useCallback(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'] // Màu theo theme Life OS
        });
    }, []);

    // Hiệu ứng pháo hoa (cho Pomodoro hoặc Level Up)
    const triggerFireworks = useCallback(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; // High z-index để hiện trên Modal

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: NodeJS.Timeout = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }, []);

    return { triggerConfetti, triggerFireworks };
};