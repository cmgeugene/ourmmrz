import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/ctx/AuthContext';
import { TaskService } from '../../services/taskService';
import { Task } from '../../types';
import { useFocusEffect } from 'expo-router';

export default function TasksScreen() {
    const { coupleId } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (coupleId) loadTasks();
        }, [coupleId])
    );

    const loadTasks = async () => {
        if (!coupleId) return;
        try {
            const data = await TaskService.getTasks(coupleId);
            setTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const addTask = async () => {
        if (newTask.trim().length === 0 || !coupleId) return;
        try {
            const task = await TaskService.createTask({
                couple_id: coupleId,
                text: newTask
            });
            setTasks([task, ...tasks]);
            setNewTask('');
        } catch (error) {
            console.error(error);
            alert('Failed to add task');
        }
    };

    const toggleTask = async (task: Task) => {
        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        setTasks(updatedTasks);

        try {
            await TaskService.updateTask(task.id, { completed: !task.completed });
        } catch (error) {
            console.error(error);
            // Revert on error
            loadTasks();
            alert('Failed to update task');
        }
    };

    const deleteTask = async (id: string) => {
        // Optimistic update
        setTasks(tasks.filter(t => t.id !== id));

        try {
            await TaskService.deleteTask(id);
        } catch (error) {
            console.error(error);
            // Revert on error
            loadTasks();
            alert('Failed to delete task');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-surface pt-14"
        >
            <View className="px-6 mb-4 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-900 font-sans">Tasks</Text>
                <Text className="text-gray-500 font-sans">{tasks.filter(t => t.completed).length}/{tasks.length}</Text>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
                renderItem={({ item }) => (
                    <View className="flex-row items-center bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
                        <TouchableOpacity onPress={() => toggleTask(item)} className="mr-3">
                            <Ionicons
                                name={item.completed ? "checkbox" : "square-outline"}
                                size={24}
                                color={item.completed ? "#9CA3AF" : "#3B82F6"}
                            />
                        </TouchableOpacity>
                        <Text className={`flex-1 text-base font-sans ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {item.text}
                        </Text>
                        <TouchableOpacity onPress={() => deleteTask(item.id)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View className="mt-20 items-center">
                        <Ionicons name="clipboard-outline" size={48} color="#E5E7EB" />
                        <Text className="text-gray-400 mt-4 font-sans text-lg">No tasks yet</Text>
                    </View>
                }
            />

            <View className="p-4 bg-white border-t border-gray-100 flex-row items-center">
                <TextInput
                    className="flex-1 bg-gray-50 p-3 rounded-xl font-sans text-base mr-3 border border-gray-200"
                    placeholder="Add a new task..."
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={addTask}
                />
                <TouchableOpacity
                    onPress={addTask}
                    className="bg-blue-500 p-3 rounded-xl"
                    disabled={newTask.trim().length === 0}
                    style={{ opacity: newTask.trim().length === 0 ? 0.5 : 1 }}
                >
                    <Ionicons name="arrow-up" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
