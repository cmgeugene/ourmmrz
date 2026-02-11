import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, RefreshControl, ActivityIndicator, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../components/ctx/AuthContext';
import { EventService } from '../../services/eventService';
import { TimelineEvent } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PLACE_CATEGORIES } from '../../constants/categories';

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
    const { coupleId, user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load events when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (coupleId) loadEvents();
        }, [coupleId])
    );

    const loadEvents = async () => {
        if (!coupleId) return;
        try {
            const data = await EventService.getEvents(coupleId);

            // Sort: Newest event_date first. Tie-breaker: Newest created_at first.
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.event_date).getTime();
                const dateB = new Date(b.event_date).getTime();
                if (dateB !== dateA) return dateB - dateA;

                // Tie-breaker
                const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return createdB - createdA;
            });

            setEvents(sortedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEvents();
    };

    const handleDelete = async (event: TimelineEvent) => {
        Alert.alert(
            "Delete Memory",
            "Are you sure you want to delete this memory? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await EventService.deleteEvent(event.id, event.image_path);
                            // Refresh events
                            loadEvents();
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to delete memory.");
                            setLoading(false); // Restore loading state if error
                        }
                    }
                }
            ]
        );
    };

    const handleMorePress = (item: TimelineEvent) => {
        Alert.alert(
            "Manage Memory",
            "Choose an action",
            [
                {
                    text: "Edit",
                    onPress: () => {
                        router.push({
                            pathname: '/view-event',
                            params: {
                                id: item.id,
                                description: item.description || '',
                                event_date: item.event_date,
                                image_path: item.image_path || '',
                                location: item.location || '',
                                keywords: JSON.stringify(item.keywords || [])
                            }
                        });
                    }
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDelete(item)
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const renderItem = ({ item, index }: { item: TimelineEvent, index: number }) => {
        const imageUrl = item.image_path ? EventService.getImageUrl(item.image_path) : null;
        const date = new Date(item.event_date);
        const isLastItem = index === events.length - 1;

        // Date Grouping Logic
        const prevItem = index > 0 ? events[index - 1] : null;
        const isNewDay = !prevItem ||
            new Date(item.event_date).toDateString() !== new Date(prevItem.event_date).toDateString();

        return (
            <View className="px-4">
                {/* Date Header (Only for new day) - Separate Section */}
                {isNewDay && (
                    <View className="mb-3 mt-4 ml-14">
                        <Text className="text-gray-900 font-bold text-2xl">
                            {format(date, 'yy.M.d EEEE', { locale: ko })}
                        </Text>
                    </View>
                )}

                <View className="flex-row">
                    {/* Left Column: Timeline Line & Node */}
                    <View className="items-center mr-4" style={{ width: 40 }}>
                        {/* Top Line (connects to previous) */}
                        {index > 0 && <View className="w-[2px] h-4 bg-gray-200" />}

                        {/* Node (Category Icon) - Always visible */}
                        <View className="w-8 h-8 bg-white rounded-full items-center justify-center z-10 border border-gray-100 shadow-sm">
                            {/* Determine icon based on category */}
                            {(() => {
                                // Find matching category
                                const matchingCategory = PLACE_CATEGORIES.find(cat =>
                                    item.keywords && item.keywords.some(k => cat.keywords.includes(k))
                                );
                                const iconName = matchingCategory ? matchingCategory.icon : 'star';

                                return <Ionicons name={iconName as any} size={16} color="#3B82F6" />;
                            })()}
                        </View>

                        {/* Bottom Line (connects to next) - extend to bottom of container */}
                        {!isLastItem && <View className="w-[2px] flex-1 bg-gray-200 -mt-1" />}
                    </View>

                    {/* Right Column: Content Card */}
                    <View className="flex-1 mb-6">
                        {/* Memory Card */}
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '/view-event',
                                params: {
                                    id: item.id,
                                    description: item.description || '',
                                    event_date: item.event_date,
                                    image_path: item.image_path || '',
                                    location: item.location || '',
                                    keywords: JSON.stringify(item.keywords || [])
                                }
                            })}
                            activeOpacity={0.9}
                            className="bg-white rounded-2xl shadow-card overflow-hidden"
                        >
                            {/* Image */}
                            {imageUrl && (
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={{ width: '100%', aspectRatio: 4 / 3 }}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Content: Description & Options */}
                            <View className="p-3">
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 mr-2">
                                        {/* Location & Icon */}
                                        {/* Location & Keywords Inline */}
                                        <View className="flex-row flex-wrap items-center mb-2">
                                            <Ionicons name="location-sharp" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text className="text-gray-600 text-sm font-medium font-sans mr-2">
                                                {item.location || '어딘가에서'}
                                            </Text>

                                            {item.keywords?.map((keyword, index) => (
                                                <View key={index} className="mr-1.5 mb-1 bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-100">
                                                    <Text className="text-pink-600 text-[10px] font-bold">#{keyword}</Text>
                                                </View>
                                            ))}
                                        </View>



                                        <Text className="text-gray-800 text-base leading-relaxed font-sans">
                                            {item.description || "No description"}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleMorePress(item)} className="p-1">
                                        <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 bg-white flex-row justify-between items-center shadow-sm z-10 mb-2">
                <Text className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Timeline</Text>
                <TouchableOpacity
                    className="bg-blue-50 p-2 rounded-full"
                    onPress={() => router.push({
                        pathname: '/(tabs)/add',
                        params: { refresh: Date.now().toString() }
                    })}
                >
                    <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {events.length === 0 ? (
                <View className="flex-1 justify-center items-center p-8">
                    <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                        <Ionicons name="heart" size={40} color="#3B82F6" />
                    </View>
                    <Text className="text-gray-900 text-center text-xl font-bold font-sans mb-2">
                        No memories yet
                    </Text>
                    <Text className="text-gray-500 text-center font-sans leading-relaxed">
                        Your timeline is empty.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
