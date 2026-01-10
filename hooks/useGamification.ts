import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/supabase';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useSound } from './useSound';

export interface Profile {
    id: string;
    xp: number;
    level: number;
    streak: number;
    last_active_date: string | null;
}

export const useGamification = (session: Session | null) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const { playSound } = useSound();

    const fetchProfile = useCallback(async () => {
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const newProfile = {
                id: session.user.id,
                xp: 0,
                level: 1,
                streak: 0,
                last_active_date: new Date().toISOString().split('T')[0]
            };
            const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (createError) {
                console.error("Error creating profile:", createError);
                toast.error("Không thể tạo hồ sơ người dùng!");
            }
            else setProfile(created);
        } else if (error) {
            console.error("Error fetching profile:", error);
        } else if (data) {
            setProfile(data);
        }
    }, [session]);

    useEffect(() => {
        if (session?.user) {
            // eslint-disable-next-line
            fetchProfile();
        }
    }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

    const addXP = async (amount: number) => {
        if (!session?.user) return;

        // Safety: If profile not loaded yet, try to load it once
        let currentProfile = profile;
        if (!currentProfile) {
            // Manually fetch avoiding helper loop if possible, or just await the promise
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (data) {
                setProfile(data);
                currentProfile = data;
            } else {
                return; // Still no profile, abort
            }
        }

        if (!currentProfile) return; // TS Narrowing

        // Save original for rollback
        const originalProfile = { ...currentProfile };

        let newXP = currentProfile.xp + amount;
        let newLevel = currentProfile.level;
        let leveledUp = false;

        const xpToNextLevel = newLevel * 100;

        if (newXP >= xpToNextLevel) {
            newXP -= xpToNextLevel;
            newLevel += 1;
            leveledUp = true;
        }

        const updates: Partial<Profile> = {
            xp: newXP,
            level: newLevel,
            last_active_date: new Date().toISOString().split('T')[0]
        };

        // Optimistic update
        const updatedProfile = { ...currentProfile, ...updates } as Profile;
        setProfile(updatedProfile);

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', session.user.id);

            if (error) throw error;

            if (leveledUp) {
                playSound('level-up');
                toast(`🎉 LEVEL UP! Bạn đã đạt Level ${newLevel}!`, {
                    icon: '🆙',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                });
            }
        } catch (error) {
            console.error("Error updating XP:", error);
            // ROLLBACK
            setProfile(originalProfile);
            toast.error("Lỗi mạng! Đã hoàn tác kinh nghiệm.", { icon: '📡' });
        }
    };

    return { profile, addXP, fetchProfile };
};
