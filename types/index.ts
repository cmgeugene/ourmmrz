export interface TimelineEvent {
    id: string;
    couple_id: string;
    author_id: string;
    image_path: string | null;
    description: string | null;
    event_date: string;
    created_at: string;
}

export interface CreateEventParams {
    couple_id: string;
    author_id: string;
    image_path?: string;
    description?: string;
    event_date: string;
}

export interface UpdateEventParams {
    description?: string;
    event_date?: string;
}
