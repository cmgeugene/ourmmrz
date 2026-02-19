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
                <View className="flex-row justify-center space-x-6">
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/add')}
                        className="items-center"
                    >
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-2 shadow-sm">
                            <Ionicons name="add" size={28} color="#3B82F6" />
                        </View>
                        <Text className="text-gray-600 text-xs font-medium">Add Memory</Text>
                    </TouchableOpacity>
                    {/* Add more widgets here later */}
                </View>
            </View>

            {/* Stats Summary */}
            <StatsSummary stats={stats} loading={loadingStats} />

            {/* Recent Tasks Preview */}
            <View className="px-6 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-900 font-bold text-lg font-sans">Tasks</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                        <Text className="text-blue-500 font-medium font-sans">See all</Text>
                    </TouchableOpacity>
                </View>

                {loadingStats ? (
                    <View className="bg-white p-4 rounded-2xl shadow-sm">
                        <ActivityIndicator />
                    </View>
                ) : tasks.length > 0 ? (
                    <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {tasks.slice(0, 3).map((task, index) => (
                            <View key={task.id}>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/tasks')}
                                    className="flex-row items-center p-4"
                                >
                                    <Ionicons
                                        name={task.completed ? "checkbox" : "square-outline"}
                                        size={20}
                                        color={task.completed ? "#9CA3AF" : "#3B82F6"}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        className={`flex-1 ml-3 font-sans ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                    >
                                        {task.text}
                                    </Text>
                                </TouchableOpacity>
                                {index < Math.min(tasks.length, 3) - 1 && (
                                    <View className="h-[1px] bg-gray-100 mx-4" />
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="bg-white p-6 rounded-2xl shadow-sm items-center">
                        <Text className="text-gray-400 font-sans mb-2">No tasks yet</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                            <Text className="text-blue-500 font-medium font-sans">Add a task</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Recent Memory Highlight */}
            <View className="px-6 mb-24">
                <Text className="text-gray-900 font-bold text-lg mb-4 font-sans">Latest Memory</Text>
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
                                className="bg-white p-4 rounded-3xl shadow-card"
                            >
                                {imageUrl && (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        className="w-full h-48 rounded-2xl mb-3"
                                        resizeMode="cover"
                                    />
                                )}
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-gray-900 font-bold text-lg mb-1">
                                            {format(new Date(latest.event_date), 'yy.M.d EEEE', { locale: ko })}
                                        </Text>

                                        {/* Location & Keywords Inline */}
                                        <View className="flex-row flex-wrap items-center mb-2">
                                            <Ionicons name="location-sharp" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text className="text-gray-600 text-sm font-medium font-sans mr-2">
                                                {latest.location || '어딘가에서'}
                                            </Text>

                                            {/* Star Rating Display */}
                                            {latest.rating && (
                                                <View className="mr-2">
                                                    <CompactStarRatingDisplay rating={latest.rating} size={12} color="#FBBF24" />
                                                </View>
                                            )}

                                            {latest.keywords?.map((keyword, index) => (
                                                <View key={index} className="mr-1.5 mb-1 bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-100">
                                                    <Text className="text-pink-600 text-[10px] font-bold">#{keyword}</Text>
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
                                    <View className="mt-1">
                                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })()
                ) : (
                    <View className="bg-white p-6 rounded-3xl shadow-card items-center py-10">
                        <Text className="text-gray-400 text-center">No memories yet.</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/add')} className="mt-4">
                            <Text className="text-primary font-bold">Create one now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
