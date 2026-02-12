import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLACE_CATEGORIES } from '../constants/categories';

interface StatsData {
    total_memories: number;
    latest_memory_date: string | null;
    top_places: { location: string; count: number }[];
    top_categories: { category: string; count: number }[];
}

interface StatsSummaryProps {
    stats: StatsData | null;
    loading: boolean;
}

export default function StatsSummary({ stats, loading }: StatsSummaryProps) {
    if (loading) {
        return (
            <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 items-center justify-center h-48 mb-6 mx-6">
                <ActivityIndicator color="#3B82F6" />
            </View>
        );
    }

    if (!stats || stats.total_memories === 0) {
        // Return null or a placeholder if no data, 
        // but HomeScreen handles "No memories" view separately.
        // If we have stats but count is 0, we can still show 0.
        return null;
    }

    return (
        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 mb-6 mx-6">
            <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name="stats-chart" size={16} color="#3B82F6" />
                </View>
                <Text className="text-gray-900 font-bold font-sans text-lg">Our Stats</Text>
            </View>

            {/* Total Memories */}
            <View className="flex-row items-baseline mb-6">
                <Text className="text-4xl font-bold text-gray-900 font-sans mr-2">
                    {stats.total_memories}
                </Text>
                <Text className="text-gray-500 font-sans text-base">memories collected</Text>
            </View>

            <View className="flex-row gap-4">
                {/* Top Place */}
                <View className="flex-1 bg-gray-50 p-3 rounded-2xl">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Most Visited</Text>
                    {stats.top_places.length > 0 ? (
                        <View>
                            <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={1}>
                                {stats.top_places[0].location}
                            </Text>
                            <View className="bg-white self-start px-2 py-0.5 rounded-md border border-gray-100">
                                <Text className="text-blue-500 text-xs font-bold">
                                    {stats.top_places[0].count} visits
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-sm italic">Not enough data</Text>
                    )}
                </View>

                {/* Top Category */}
                <View className="flex-1 bg-gray-50 p-3 rounded-2xl">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Favorite Vibe</Text>
                    {stats.top_categories.length > 0 ? (
                        <View>
                            <View className="flex-row items-center mb-1">
                                {(() => {
                                    const catId = stats.top_categories[0].category;
                                    const category = PLACE_CATEGORIES.find(c => c.id === catId);
                                    return (
                                        <>
                                            <Ionicons name={category?.icon as any || 'star'} size={16} color="#EC4899" style={{ marginRight: 4 }} />
                                            <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>
                                                {category?.label || catId}
                                            </Text>
                                        </>
                                    );
                                })()}
                            </View>
                            <View className="bg-white self-start px-2 py-0.5 rounded-md border border-gray-100">
                                <Text className="text-pink-500 text-xs font-bold">
                                    {stats.top_categories[0].count} times
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-sm italic">Not enough data</Text>
                    )}
                </View>
            </View>
        </View>
    );
}
