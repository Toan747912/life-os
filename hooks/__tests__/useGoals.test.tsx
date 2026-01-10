import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useGoals } from '../useGoals';
import { supabase } from '@/app/supabase';
import toast from 'react-hot-toast';

// Mock Supabase Client
vi.mock('@/app/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Auto-mock toast to ensure correct spy binding
vi.mock('react-hot-toast');

// Robust Builder Mock Helper
interface MockBuilder {
    select: Mock;
    eq: Mock;
    is: Mock;
    order: Mock;
    insert: Mock;
    update: Mock;
    delete: Mock;
    upsert: Mock;
    ilike: Mock;
    then: (resolve: (value: { data: unknown; error: unknown }) => void) => void;
    maybeSingle: Mock;
    single: Mock;
}

const createMockBuilder = (resultData: unknown = [], error: unknown = null): MockBuilder => {
    const builder: Partial<MockBuilder> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: resultData, error }),
        maybeSingle: vi.fn().mockResolvedValue({ data: resultData, error }),
        single: vi.fn().mockResolvedValue({ data: resultData, error }),
    };
    return builder as MockBuilder;
};

describe('useGoals Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Fetch Goals: Should call Supabase with correct query', async () => {
        const mockData = [{ id: 1, text: 'Test Goal', parent_id: null }];
        const builder = createMockBuilder(mockData);
        (supabase.from as Mock).mockReturnValue(builder);

        const { result } = renderHook(() => useGoals());

        await act(async () => {
            await result.current.fetchGoals(new Date('2026-01-10'));
        });

        expect(supabase.from).toHaveBeenCalledWith('goals');
        expect(builder.eq).toHaveBeenCalledWith('target_date', '2026-01-10');
        expect(result.current.goals).toEqual(mockData);
    });

    it('2. Add Goal: Should validate input and update optimistic state', async () => {
        const mockNewGoal = { id: 100, text: '', target_date: '2026-01-10', type: 'daily' };
        const builder = createMockBuilder([mockNewGoal]);
        (supabase.from as Mock).mockReturnValue(builder);

        const { result } = renderHook(() => useGoals());

        await act(async () => {
            await result.current.addGoal('daily', new Date('2026-01-10'));
        });

        expect(builder.insert).toHaveBeenCalled();
        expect(result.current.goals).toContainEqual(mockNewGoal);
    });

    it('3. Recurring Logic: Should sync routine and filter existing tasks', async () => {
        const mockTemplate = [{ text: 'Morning Run', category: 'health', priority: 1 }];
        const mockCurrentTasks = [{ text: 'Read Book' }];

        // We expect 3 distinct calls
        const templateBuilder = createMockBuilder(mockTemplate);
        const usersTaskBuilder = createMockBuilder(mockCurrentTasks);
        const insertBuilder = createMockBuilder([{ text: 'Morning Run', type: 'daily_routine' }]);

        (supabase.from as Mock)
            .mockReturnValueOnce(templateBuilder)
            .mockReturnValueOnce(usersTaskBuilder)
            .mockReturnValueOnce(insertBuilder);

        const { result } = renderHook(() => useGoals());

        await act(async () => {
            await result.current.syncRoutine(new Date('2026-01-10'));
        });

        expect(insertBuilder.insert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ text: 'Morning Run' })
        ]));
    });

    it('4. Project Management: Should prevent duplicate projects', async () => {
        // 1. Mock existing project found
        const checkBuilder = createMockBuilder({ id: 99 });
        (supabase.from as Mock).mockReturnValue(checkBuilder);

        const { result } = renderHook(() => useGoals());

        await act(async () => {
            const added = await result.current.addProject('Duplicate Project');
            // If logic works, it returns null early
            expect(added).toBeNull();
        });

        expect(checkBuilder.ilike).toHaveBeenCalledWith('text', 'Duplicate Project');
        // Verify toast was called
        expect(toast.error).toHaveBeenCalledWith("Dự án này đã tồn tại!");
    });
});
