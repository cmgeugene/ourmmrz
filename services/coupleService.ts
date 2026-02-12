import { supabase } from '../lib/supabase';
import { Couple, UserProfile } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const CoupleService = {
    /**
     * Get couple details by ID
     */
    getCouple: async (coupleId: string): Promise<Couple | null> => {
        const { data, error } = await supabase
            .from('couples')
            .select('*')
            .eq('id', coupleId)
            .single();

        if (error) {
            console.error('Error fetching couple:', error);
            return null;
        }
        return data;
    },

    /**
     * Update first met date
     */
    updateFirstMetDate: async (coupleId: string, date: string): Promise<Couple | null> => {
        const { data, error } = await supabase
            .from('couples')
            .update({ first_met_date: date })
            .eq('id', coupleId)
            .select()
            .single();

        if (error) {
            console.error('Error updating first met date:', error);
            throw error;
        }
        return data;
    },

    /**
     * Get partner profile
     */
    getPartner: async (coupleId: string, currentUserId: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('couple_id', coupleId)
            .neq('id', currentUserId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "Row not found" error
            console.error('Error fetching partner:', error);
        }
        return data;
    },

    /**
     * Get user profile
     */
    getUser: async (userId: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }
        return data;
    },

    /**
     * Update user profile (nickname, image)
     */
    updateProfile: async (userId: string, updates: { nickname?: string; profile_image_url?: string }) => {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Upload profile image
     */
    uploadProfileImage: async (userId: string, uri: string): Promise<string> => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const timestamp = new Date().getTime();
            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            // Correct path: Just {userId}/{timestamp}.{ext} to match RLS: (storage.foldername(name))[1] = auth.uid()
            const path = `${userId}/${timestamp}.${ext}`;

            const { data, error } = await supabase.storage
                .from('profiles') // Use the dedicated profiles bucket
                .upload(path, decode(base64), {
                    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                    upsert: true,
                });

            if (error) throw error;
            return data.path;
        } catch (e) {
            console.error('Error uploading profile image:', e);
            throw e;
        }
    },

    /**
     * Get public URL for image (Helper wrapper)
     */
    getImageUrl: (path: string) => {
        const { data } = supabase.storage.from('profiles').getPublicUrl(path);
        return data.publicUrl;
    }
};
