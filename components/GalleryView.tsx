import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../components/ctx/AuthContext';
import { EventService } from '../services/eventService';
import { TimelineEvent } from '../types';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2; // Gap between images
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

interface GallerySection {
    title: string;
    data: TimelineEvent[][]; // Data is an array of "Rows" (which are arrays of events)
}

export default function GalleryView() {
    const { coupleId } = useAuth();
    const router = useRouter();
    const [sections, setSections] = useState<GallerySection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initial Load
    useFocusEffect(
        useCallback(() => {
            if (coupleId) loadEvents();
        }, [coupleId])
    );

    const formatSectionsForGrid = (events: TimelineEvent[]) => {
        // 1. Filter events with images
        const eventsWithImages = events.filter(event => event.image_path);

        // 2. Sort by date descending
        eventsWithImages.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

        // 3. Group by Month (YY.M)
        const grouped: { [key: string]: TimelineEvent[] } = {};
        eventsWithImages.forEach(event => {
            const date = new Date(event.event_date);
            const key = format(date, 'yy.M'); // e.g., "24.2"
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(event);
        });

        // 4. Create Sections with Rows
        return Object.keys(grouped).map(key => {
            const groupEvents = grouped[key];
            const rows: TimelineEvent[][] = [];
            for (let i = 0; i < groupEvents.length; i += COLUMN_COUNT) {
                rows.push(groupEvents.slice(i, i + COLUMN_COUNT));
            }
            return {
                title: key,
                data: rows
            };
        });
    };

    const loadEvents = async () => {
        if (!coupleId) return;
        try {
            const data = await EventService.getEvents(coupleId);
            const formattedSections = formatSectionsForGrid(data);
            setSections(formattedSections);
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

    const handleImagePress = (item: TimelineEvent) => {
        router.push({
            pathname: '/view-event',
            params: {
                id: item.id,
                description: item.description || '',
                event_date: item.event_date,
                image_path: item.image_path || '',
                location: item.location || '',
                latitude: item.latitude?.toString() || '',
                longitude: item.longitude?.toString() || '',
                keywords: JSON.stringify(item.keywords || [])
            }
        });
    };

    const renderRow = ({ item }: { item: TimelineEvent[] }) => (
        <View className="flex-row w-full mb-[2px]">
            {item.map((event, index) => {
                const imageUrl = event.image_path ? EventService.getImageUrl(event.image_path) : null;
                return (
                    <TouchableOpacity
                        key={event.id}
                        onPress={() => handleImagePress(event)}
                        activeOpacity={0.7}
                        style={{
                            width: ITEM_WIDTH,
                            height: ITEM_WIDTH,
                            marginRight: index < item.length - 1 ? SPACING : 0
                        }}
                    >
                        {imageUrl && (
                            <Image
                                source={{ uri: imageUrl }}
                                className="w-full h-full bg-gray-200"
                                resizeMode="cover"
                            />
                        )}
                    </TouchableOpacity>
                );
            })}
            {/* Spacer for incomplete rows */}
            {Array.from({ length: COLUMN_COUNT - item.length }).map((_, i) => (
                <View
                    key={`empty-${i}`}
                    style={{
                        width: ITEM_WIDTH,
                        marginRight: i < (COLUMN_COUNT - item.length - 1) ? SPACING : 0
                    }}
                />
            ))}
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            {sections.length === 0 ? (
                <View className="flex-1 justify-center items-center mt-20">
                    <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                        <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-400 font-sans text-lg">No photos yet</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    renderItem={renderRow}
                    renderSectionHeader={({ section: { title } }) => (
                        <View className="bg-blue-50 px-6 py-2 flex-row items-center border-b border-blue-100">
                            <Text className="text-base font-bold text-blue-600 font-sans">{title}</Text>
                        </View>
                    )}
                    keyExtractor={(item, index) => `row-${index}`}
                    stickySectionHeadersEnabled={true}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
                    }
                />
            )}
        </View>
    );
}
