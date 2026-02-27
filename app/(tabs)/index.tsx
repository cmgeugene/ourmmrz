import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../components/ctx/AuthContext';
import { EventService } from '../../services/eventService';
import { CoupleService } from '../../services/coupleService';
import { TaskService } from '../../services/taskService';
import { TimelineEvent, Task } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CompactStarRatingDisplay } from '../../components/StarRating';
import StatsSummary from '../../components/StatsSummary';

export default function HomeScreen() {
    const { coupleId, user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [daysTogether, setDaysTogether] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (coupleId) loadData();
        }, [coupleId])
    );

    const loadData = async () => {
        if (!coupleId) return;
        try {
            // Parallel fetching
            const [eventsData, coupleData, statsData, tasksData] = await Promise.all([
                EventService.getEvents(coupleId),
                CoupleService.getCouple(coupleId),
                EventService.getStats(coupleId),
                TaskService.getTasks(coupleId)
            ]);

            setEvents(eventsData);
            const sortedTasks = (tasksData || []).sort((a: Task, b: Task) => {
                if (a.completed === b.completed) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.completed ? 1 : -1;
            });
            setTasks(sortedTasks);
            setStats(statsData);
            setLoadingStats(false);

            let startDate = Date.now();

            if (coupleData && coupleData.first_met_date) {
                // Use First Met Date if set
                startDate = new Date(coupleData.first_met_date).getTime();
            } else if (eventsData.length > 0) {
                // Fallback to oldest memory
                const dates = eventsData.map((e: any) => new Date(e.event_date).getTime());
                startDate = Math.min(...dates);
            }

            const diff = Date.now() - startDate;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
            setDaysTogether(isValidDate(startDate) ? days : 1);

        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
            setLoadingStats(false);
        }
    };

    const isValidDate = (d: any) => {
        return d instanceof Date ? !isNaN(d.getTime()) : !isNaN(d);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <ScrollView
            className="flex-1 bg-surface"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        >
            {/* Header / Days Together Widget */}
            <View className="pt-20 pb-10 px-6 bg-white rounded-b-[40px] shadow-sm mb-6">
                <Text className="text-gray-500 font-medium text-center mb-2 uppercase tracking-widest text-xs">
                    We've been together for
                </Text>
                <View className="flex-row justify-center items-baseline mb-6">
                    <Text className="text-6xl font-bold text-primary mr-2 font-sans tracking-tight">{daysTogether}</Text>
                    <Text className="text-2xl font-medium text-gray-400 font-sans">days</Text>
                </View>

                {/* Quick Actions */}
                <View className="flex-row justify-center space-x-8 px-4">
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/add')}
                        className="items-center w-20"
                    >
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-2 shadow-sm relative">
                            <Ionicons name="camera" size={32} color="#3B82F6" />
                            <View className="absolute -top-1 -right-1 bg-white rounded-full">
                                <Ionicons name="add-circle" size={22} color="#3B82F6" />
                            </View>
                        </View>
                        <Text className="text-gray-600 text-xs font-medium text-center" numberOfLines={1}>New Memory</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/tasks')}
                        className="items-center w-20"
                    >
                        <View className="w-14 h-14 bg-green-50 rounded-2xl items-center justify-center mb-2 shadow-sm relative">
                            <Ionicons name="checkbox" size={32} color="#3B82F6" />
                            <View className="absolute -top-1 -right-1 bg-white rounded-full">
                                <Ionicons name="add-circle" size={22} color="#3B82F6" />
                            </View>
                        </View>
                        <Text className="text-gray-600 text-xs font-medium text-center" numberOfLines={1}>New Tasks</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Summary */}
            <StatsSummary stats={stats} loading={loadingStats} />

            {/* Recent Tasks Preview */}
            <View className="px-6 mb-6">
                {loadingStats ? (
                    <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 h-[180px] justify-center">
                        <ActivityIndicator color="#3B82F6" />
                    </View>
                ) : tasks.length > 0 ? (
                    <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100/40 border border-gray-50">
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="checkbox" size={20} color="#3B82F6" />
                                </View>
                                <Text className="text-gray-900 font-extrabold text-xl font-sans">Tasks</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                                <Text className="text-blue-600 font-bold font-sans">See all</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="h-[1px] bg-gray-100 mb-3" />
                        <View className="bg-white rounded-2xl overflow-hidden">
                            {tasks.slice(0, 3).map((task, index) => (
                                <View key={task.id}>
                                    <TouchableOpacity
                                        onPress={() => router.push('/(tabs)/tasks')}
                                        className="flex-row items-center py-4"
                                    >
                                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${task.completed ? 'bg-gray-100 border-gray-200' : 'border-blue-500 bg-blue-50/30'}`}>
                                            {task.completed && <Ionicons name="checkmark" size={14} color="#9CA3AF" />}
                                        </View>
                                        <Text
                                            numberOfLines={1}
                                            className={`flex-1 font-sans text-base ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}
                                        >
                                            {task.text}
                                        </Text>
                                    </TouchableOpacity>
                                    {index < Math.min(tasks.length, 3) - 1 && (
                                        <View className="h-[1px] bg-gray-50" />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100/40 border border-gray-50">
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="checkbox" size={20} color="#10B981" />
                                </View>
                                <Text className="text-gray-900 font-extrabold text-xl font-sans">Tasks</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                                <Text className="text-blue-600 font-bold font-sans">See all</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="h-[1px] bg-gray-100 mb-4" />
                        <View className="bg-blue-50/40 p-6 rounded-3xl border border-blue-50 items-center py-8">
                            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-3 shadow-sm shadow-blue-100/50">
                                <Ionicons name="checkbox-outline" size={24} color="#9CA3AF" />
                            </View>
                            <Text className="text-gray-500 font-medium font-sans mb-3 text-center">No upcoming tasks</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/tasks')}
                                className="bg-white px-5 py-2.5 rounded-full shadow-sm shadow-blue-100/50 border border-blue-50"
                            >
                                <Text className="text-blue-600 font-bold font-sans">Add a task</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Recent Memory Highlight */}
            <View className="px-6 mb-24">
                {events.length > 0 ? (
                    (() => {
                        // Get most recent event
                        const latest = events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
                        const imageUrl = latest.image_path ? EventService.getImageUrl(latest.image_path) : null;
                        return (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/view-event',
                                    params: {
                                        id: latest.id,
                                        description: latest.description || '',
                                        event_date: latest.event_date,
                                        image_path: latest.image_path || '',
                                        location: latest.location || '',
                                        longitude: latest.longitude?.toString() || '',
                                        keywords: JSON.stringify(latest.keywords || []),
                                        rating: latest.rating?.toString() || ''
                                    }
                                })}
                                className="bg-white p-5 rounded-3xl shadow-sm shadow-blue-100 border border-gray-50"
                            >
                                <View className="flex-row justify-between items-center mb-4">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 bg-pink-50 rounded-full items-center justify-center mr-3">
                                            <Ionicons name="images" size={20} color="#3B82F6" />
                                        </View>
                                        <Text className="text-gray-900 font-extrabold text-xl font-sans">Latest Memory</Text>
                                    </View>
                                </View>
                                <View className="h-[1px] bg-gray-100 mb-4" />

                                {imageUrl && (
                                    <View className="relative">
                                        <Image
                                            source={{ uri: imageUrl }}
                                            className="w-full h-56 rounded-2xl mb-4"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                            <Text className="text-gray-900 font-bold text-xs tracking-wide">
                                                {format(new Date(latest.event_date), 'MMM d, yyyy')}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Card Content */}
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 pr-3">
                                        {!imageUrl && (
                                            <Text className="text-blue-600 font-bold text-sm mb-2 tracking-wide uppercase">
                                                {format(new Date(latest.event_date), 'yyyy.MM.dd')}
                                            </Text>
                                        )}

                                        {/* Location & Keywords Inline */}
                                        <View className="flex-row flex-wrap items-center mt-1 mb-3">
                                            <View className="flex-row items-center mr-3 bg-gray-50 px-2 py-1 rounded-lg">
                                                <Ionicons name="location" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                                                <Text className="text-gray-700 text-xs font-bold font-sans">
                                                    {latest.location || 'Unknown Location'}
                                                </Text>
                                            </View>

                                            {/* Star Rating Display */}
                                            {latest.rating && (
                                                <View className="mr-3 bg-orange-50 px-2 py-1 rounded-lg flex-row items-center">
                                                    <CompactStarRatingDisplay rating={latest.rating} size={10} color="#F59E0B" />
                                                </View>
                                            )}

                                            {latest.keywords?.slice(0, 3).map((keyword, index) => (
                                                <View key={index} className="mr-1.5 mb-1.5 bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-100/50">
                                                    <Text className="text-blue-600 text-[10px] font-extrabold tracking-wide">#{keyword}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Description */}
                                        {latest.description && (
                                            <Text className="text-gray-500 text-sm leading-relaxed" numberOfLines={2}>
                                                {latest.description}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center -mr-1">
                                        <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })()
                ) : (
                    <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100 border border-gray-50">
                        <View className="flex-row justify-between items-center mb-0">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-pink-50 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="images" size={20} color="#EC4899" />
                                </View>
                                <Text className="text-gray-900 font-extrabold text-xl font-sans">Latest Memory</Text>
                            </View>
                        </View>
                        <View className="h-[1px] bg-gray-100 mb-4" />
                        <View className="bg-pink-50/40 p-6 rounded-3xl border border-pink-50 items-center py-10 shadow-sm shadow-pink-100/20">
                            <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4 shadow-sm shadow-pink-100/50">
                                <Ionicons name="images-outline" size={32} color="#EC4899" />
                            </View>
                            <Text className="text-gray-500 font-medium font-sans mb-4 text-center">No memories created yet.</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/add')}
                                className="bg-white px-6 py-3 rounded-full shadow-sm shadow-pink-100/50 border border-pink-50"
                            >
                                <Text className="text-pink-600 font-bold font-sans">Create your first memory</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
