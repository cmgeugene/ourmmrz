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
            <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100 border border-gray-50 items-center justify-center h-48 mb-6 mx-6">
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
        <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100 border border-gray-50 mb-6 mx-6">
            <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                </View>
                <Text className="text-gray-900 font-extrabold font-sans text-xl">Our Stats</Text>
            </View>
            <View className="h-[1px] bg-gray-100 mb-4" />

            {/* Total Memories */}
            <View className="flex-row items-baseline mb-6">
                <Text className="text-5xl font-extrabold text-blue-600 font-sans mr-2 tracking-tight">
                    {stats.total_memories}
                </Text>
                <Text className="text-gray-500 font-sans text-base font-medium">memories collected</Text>
            </View>

            <View className="flex-row gap-4">
                {/* Top Place */}
                <View className="flex-1 bg-blue-50/60 p-4 rounded-3xl border border-blue-100/50">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="location" size={14} color="#3B82F6" style={{ marginRight: 6 }} />
                        <Text className="text-blue-600/80 text-xs font-extrabold uppercase tracking-wider">Most Visited</Text>
                    </View>
                    {stats.top_places.length > 0 ? (
                        <View>
                            <Text className="text-gray-900 font-extrabold text-base mb-2" numberOfLines={1}>
                                {stats.top_places[0].location}
                            </Text>
                            <View className="bg-white/80 self-start px-2.5 py-1 rounded-lg border border-blue-50 shadow-sm shadow-blue-100/20">
                                <Text className="text-blue-600 text-xs font-bold">
                                    {stats.top_places[0].count} visits
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-sm italic mt-1">Not enough data</Text>
                    )}
                </View>

                {/* Top Category */}
                <View className="flex-1 bg-pink-50/60 p-4 rounded-3xl border border-pink-100/50">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="heart" size={14} color="#EC4899" style={{ marginRight: 6 }} />
                        <Text className="text-pink-600/80 text-xs font-extrabold uppercase tracking-wider">Favorite Vibe</Text>
                    </View>
                    {stats.top_categories.length > 0 ? (
                        <View>
                            <View className="flex-row items-center mb-2">
                                {(() => {
                                    const catId = stats.top_categories[0].category;
                                    const category = PLACE_CATEGORIES.find(c => c.id === catId);
                                    return (
                                        <>
                                            <Ionicons name={category?.icon as any || 'star'} size={16} color="#EC4899" style={{ marginRight: 6 }} />
                                            <Text className="text-gray-900 font-extrabold text-base" numberOfLines={1}>
                                                {category?.label || catId}
                                            </Text>
                                        </>
                                    );
                                })()}
                            </View>
                            <View className="bg-white/80 self-start px-2.5 py-1 rounded-lg border border-pink-50 shadow-sm shadow-pink-100/20">
                                <Text className="text-pink-600 text-xs font-bold">
                                    {stats.top_categories[0].count} times
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-sm italic mt-1">Not enough data</Text>
                    )}
                </View>
            </View>
        </View>
    );
}
