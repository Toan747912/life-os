export interface Goal {
    id: number;
    text: string;
    done: boolean;
    target_date: string;
    category?: string;
    priority?: number;
    estimated_minutes?: number;
    completed_sessions?: number;
    focus_span?: number;
    mode?: string;
    type?: string;
    parent_id?: number | null;
}
