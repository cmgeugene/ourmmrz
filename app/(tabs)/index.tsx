import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, RefreshControl, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '../../components/ctx/AuthContext';
import { EventService } from '../../services/eventService';
import { TimelineEvent } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
    const { coupleId } = useAuth();
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

    const renderItem = ({ item }: { item: TimelineEvent }) => {
        const imageUrl = item.image_path ? EventService.getImageUrl(item.image_path) : null;

        return (
            <View className="mb-8">
                {/* Date Header */}
                <View className="px-4 mb-2 flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-primary mr-2" style={{ backgroundColor: '#f4256a' }} />
                    <Text className="text-gray-500 font-medium">
                        {format(new Date(item.event_date), 'MMMM d, yyyy')}
                    </Text>
                </View>

                {/* Image Card */}
                <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    {imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: width - 32 }} // Square aspect ratio
                            resizeMode="cover"
                        />
                    )}

                    {item.description && (
                        <View className="p-4">
                            <Text className="text-gray-800 text-base leading-6">{item.description}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#f4256a" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="pt-14 pb-4 px-4 bg-white flex-row justify-between items-center shadow-sm z-10">
                <Text className="text-2xl font-bold text-gray-900">Our Memories</Text>
                <Link href="/(tabs)/add" asChild>
                    <TouchableOpacity className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="add" size={24} color="#f4256a" />
                    </TouchableOpacity>
                </Link>
            </View>

            {events.length === 0 ? (
                <View className="flex-1 justify-center items-center p-8">
                    <Ionicons name="images-outline" size={64} color="#ccc" />
                    <Text className="text-gray-500 text-center mt-4 text-lg">
                        No memories yet.
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                        Tap the + button to add your first memory!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f4256a" />
                    }
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
