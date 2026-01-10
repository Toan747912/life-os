import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GoalItem from './GoalItem';

interface SortableGoalItemProps {
    goal: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    index: number;
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function SortableGoalItem({ goal, ...props }: SortableGoalItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: goal.id,
        disabled: goal.mode === 'strict'
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Prevent scrolling on mobile while dragging
    };

    return (
        <div ref={setNodeRef} style={style} className="relative z-0">
            {/* 
          Moved listeners/attributes to GoalItem via dragHandleProps 
          to enable Drag Handle only
       */}
            <GoalItem
                goal={goal}
                {...(props as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}
