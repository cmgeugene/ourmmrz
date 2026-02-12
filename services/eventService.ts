import { supabase } from '../lib/supabase';
import { TimelineEvent, CreateEventParams } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const EventService = {
    /**
     * Fetch timeline events for a given couple
     */
    getEvents: async (coupleId: string): Promise<TimelineEvent[]> => {
        const { data, error } = await supabase
            .from('timeline_events')
            .select('*')
            .eq('couple_id', coupleId)
            .order('event_date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Fetch timeline events for a specific month
     */
    getEventsByMonth: async (coupleId: string, year: number, month: number): Promise<TimelineEvent[]> => {
        // Calculate start and end date of the month
        // Month is 1-indexed (1 = January, 12 = December)
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
            .from('timeline_events')
            .select('*')
            .eq('couple_id', coupleId)
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    getEventById: async (id: string): Promise<TimelineEvent | null> => {
        const { data, error } = await supabase
            .from('timeline_events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Upload an image to Supabase Storage
     * Returns the path in storage
     */
    uploadImage: async (coupleId: string, uri: string): Promise<string> => {
        try {
            // 1. Read file as base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // 2. Generate unique filename
            const timestamp = new Date().getTime();
            const random = Math.floor(Math.random() * 1000);
            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${coupleId}/${timestamp}_${random}.${ext}`;

            // 3. Upload to Supabase
            const { data, error } = await supabase.storage
                .from('memories')
                .upload(path, decode(base64), {
                    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                    upsert: false,
                });

            if (error) throw error;
            return data.path;
        } catch (e) {
            console.error('Error uploading image:', e);
            throw e;
        }
    },

    /**
     * Create a new timeline event record
     */
    createEvent: async (params: CreateEventParams): Promise<TimelineEvent> => {
        const { data, error } = await supabase
            .from('timeline_events')
            .insert(params)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get public URL for an image path
     * (If bucket is public)
     */
    getImageUrl: (path: string) => {
        const { data } = supabase.storage.from('memories').getPublicUrl(path);
        return data.publicUrl;
    },

    deleteEvent: async (id: string, imagePath: string | null) => {
        // 1. Delete from DB
        const { error: dbError } = await supabase
            .from('timeline_events')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // 2. Delete from Storage if path exists
        if (imagePath) {
            const { error: storageError } = await supabase.storage
                .from('memories')
                .remove([imagePath]);

            if (storageError) {
                console.error('Error deleting image from storage:', storageError);
                throw storageError; // Re-throw to alert the user
            }
        }
    },

    updateEvent: async (id: string, params: import('../types').UpdateEventParams) => {
        const { error } = await supabase
            .from('timeline_events')
            .update(params)
            .eq('id', id);

        if (error) throw error;
    }
};
