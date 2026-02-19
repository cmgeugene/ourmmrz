import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../components/ctx/AuthContext';
import { EventService } from '../../services/eventService';
import { TimelineEvent } from '../../types';
import { CompactStarRatingDisplay } from '../../components/StarRating';

import { PLACE_CATEGORIES } from '../../constants/categories';

export default function SearchScreen() {
    const router = useRouter();
    const { coupleId } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (coupleId) loadData();
        }, [coupleId])
    );

    const loadData = async () => {
        if (!coupleId) return;
        setLoading(true);
        try {
            const data = await EventService.getEvents(coupleId);
            setAllEvents(data);
        } catch (error) {
            console.error("Failed to load events for search", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchText.trim().length === 0) {
            setFilteredEvents([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        const timeoutId = setTimeout(() => {
            const lowerQuery = searchText.toLowerCase();
            const results = allEvents.filter(event => {
                const descriptionMatch = event.description?.toLowerCase().includes(lowerQuery);
                const locationMatch = event.location?.toLowerCase().includes(lowerQuery);
                const categoryMatch = event.category?.toLowerCase().includes(lowerQuery);

                // Check category label (e.g. '맛집' for 'restaurant')
                const categoryObj = PLACE_CATEGORIES.find(c => c.id === event.category);
                const categoryLabelMatch = categoryObj?.label.toLowerCase().includes(lowerQuery);

                const keywordMatch = event.keywords?.some(k => k.toLowerCase().includes(lowerQuery));

                return descriptionMatch || locationMatch || categoryMatch || categoryLabelMatch || keywordMatch;
            });
            // Sort by date descending
            results.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

            setFilteredEvents(results);
            setSearching(false);
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [searchText, allEvents]);

    const renderItem = ({ item }: { item: TimelineEvent }) => {
        const imageUrl = item.image_path ? EventService.getImageUrl(item.image_path) : null;

        return (
            <TouchableOpacity
                onPress={() => router.push({
                    pathname: '/view-event',
                    params: {
                        id: item.id,
                        description: item.description || '',
                        event_date: item.event_date,
                        image_path: item.image_path || '',
                        location: item.location || '',
                        latitude: item.latitude?.toString() || '',
                        longitude: item.longitude?.toString() || '',
                        category: item.category || '',
                        keywords: JSON.stringify(item.keywords || []),
                        rating: item.rating?.toString() || ''
                    }
                })}
                className="flex-row bg-white p-3 rounded-xl mb-3 shadow-sm border border-gray-100"
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-16 h-16 rounded-lg bg-gray-200"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-16 h-16 rounded-lg bg-gray-100 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#D1D5DB" />
                    </View>
                )}

                <View className="flex-1 ml-3 justify-center">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-gray-900 font-bold font-sans text-base flex-1 mr-2" numberOfLines={1}>
                            {item.location || "No location"}
                        </Text>
                        <Text className="text-gray-400 text-xs font-sans">
                            {item.event_date.split('T')[0]}
                        </Text>
                    </View>

                    <Text className="text-gray-600 text-sm font-sans mb-1" numberOfLines={1}>
                        {item.description || "No description"}
                    </Text>

                    <View className="flex-row items-center">
                        {item.rating ? (
                            <CompactStarRatingDisplay rating={item.rating} size={10} color="#FBBF24" />
                        ) : null}

                        {item.keywords && item.keywords.length > 0 && (
                            <View className="flex-row ml-2">
                                {item.keywords.slice(0, 2).map((k, i) => (
                                    <View key={i} className="bg-gray-100 px-1.5 py-0.5 rounded mr-1">
                                        <Text className="text-gray-500 text-[10px]">#{k}</Text>
                                    </View>
                                ))}
                                {item.keywords.length > 2 && (
                                    <Text className="text-gray-400 text-[10px] self-center">+{item.keywords.length - 2}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-surface pt-14 px-6">
            <Text className="text-2xl font-bold text-gray-900 font-sans mb-4">Search</Text>

            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    className="flex-1 ml-2 text-base font-sans text-gray-900"
                    placeholder="Search memories..."
                    placeholderTextColor="#9CA3AF"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                </View>
            ) : searchText.length > 0 ? (
                searching ? (
                    <View className="mt-10 items-center">
                        <ActivityIndicator size="small" color="#9CA3AF" />
                    </View>
                ) : filteredEvents.length > 0 ? (
                    <FlatList
                        data={filteredEvents}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                ) : (
                    <View className="mt-20 items-center">
                        <Ionicons name="search-outline" size={48} color="#E5E7EB" />
                        <Text className="text-gray-400 mt-4 font-sans text-lg">No matches found</Text>
                        <Text className="text-gray-400 text-sm font-sans mt-1">Try different keywords or filters</Text>
                    </View>
                )
            ) : (
                <View className="flex-1 justify-center items-center opacity-50">
                    <Ionicons name="search" size={64} color="#E5E7EB" />
                    <Text className="text-gray-400 mt-4 font-sans">Enter a keyword to search</Text>
                    <Text className="text-gray-400 text-xs mt-2">Location, category, description, tags...</Text>
                </View>
            )}
        </View>
    );
}
