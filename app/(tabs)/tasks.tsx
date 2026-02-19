import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    const addTask = () => {
        if (newTask.trim().length === 0) return;
        const task: Task = {
            id: Date.now().toString(),
            text: newTask,
            completed: false
        };
        setTasks([...tasks, task]);
        setNewTask('');
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
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
                renderItem={({ item }) => (
                    <View className="flex-row items-center bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
                        <TouchableOpacity onPress={() => toggleTask(item.id)} className="mr-3">
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
