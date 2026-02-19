import { supabase } from '../lib/supabase';
import { Task, CreateTaskParams, UpdateTaskParams } from '../types';

export const TaskService = {
    /**
     * Fetch tasks for a given couple
     */
    getTasks: async (coupleId: string): Promise<Task[]> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new task
     */
    createTask: async (params: CreateTaskParams): Promise<Task> => {
        const { data, error } = await supabase
            .from('tasks')
            .insert(params)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a task
     */
    updateTask: async (id: string, updates: UpdateTaskParams) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete a task
     */
    deleteTask: async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
