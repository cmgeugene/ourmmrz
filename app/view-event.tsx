import { View, Text, Image, ScrollView, TouchableOpacity, Alert, Modal, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { EventService } from '../services/eventService';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ViewEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const id = params.id as string;
    const description = params.description as string;
    const event_date = params.event_date as string;
    const location = params.location as string;
    const imagePath = params.image_path as string;
    // Parse keywords
    const keywords = params.keywords ? (typeof params.keywords === 'string' ? JSON.parse(params.keywords) : params.keywords) : [];

    const imageUrl = imagePath ? EventService.getImageUrl(imagePath) : null;
    const date = new Date(event_date);
    const [modalVisible, setModalVisible] = useState(false);

    const handleEdit = () => {
        router.push({
            pathname: '/edit-event',
            params: {
                id,
                description,
                event_date,
                location,
                image_path: imagePath,
                keywords: JSON.stringify(keywords)
            }
        });
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1" bounces={false}>
                {/* Hero Image */}
                <View className="relative">
                    {imageUrl ? (
                        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.9}>
                            <Image
                                source={{ uri: imageUrl }}
                                className="w-full h-96"
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ) : (
                        <View className="w-full h-64 bg-gray-100 justify-center items-center">
                            <Ionicons name="image-outline" size={48} color="#CBD5E1" />
                        </View>
                    )}

                    {/* Top Actions */}
                    <View className="absolute top-14 left-0 right-0 px-5 flex-row justify-between items-center z-10">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-black/30 rounded-full items-center justify-center backdrop-blur-sm"
                        >
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleEdit}
                            className="px-4 py-2 bg-black/30 rounded-full backdrop-blur-sm"
                        >
                            <Text className="text-white font-bold text-sm">Edit</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Gradient Overlay for Text Readability */}
                    <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                </View>

                {/* Content Container */}
                <View className="-mt-10 bg-white rounded-t-[32px] px-6 pt-8 pb-10 min-h-screen shadow-lg">
                    {/* Date & Location Header */}
                    <View className="mb-6">
                        <Text className="text-3xl font-bold text-gray-900 font-sans mb-2">
                            {format(date, 'yyyy.MM.dd', { locale: ko })}
                        </Text>
                        <Text className="text-xl text-gray-500 font-medium font-sans mb-4">
                            {format(date, 'EEEE', { locale: ko })}
                        </Text>

                        {location ? (
                            <View className="flex-row items-center">
                                <Ionicons name="location-sharp" size={18} color="#3B82F6" className="mr-1" />
                                <Text className="text-gray-600 font-sans text-base">{location}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View className="h-[1px] bg-gray-100 w-full mb-6" />

                    {/* Keywords */}
                    {keywords && keywords.length > 0 && (
                        <View className="flex-row flex-wrap mb-6">
                            {keywords.map((keyword: string, index: number) => (
                                <View key={index} className="mr-2 mb-2 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                                    <Text className="text-pink-600 text-sm font-bold">#{keyword}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    {description ? (
                        <Text className="text-gray-800 text-lg leading-loose font-sans">
                            {description}
                        </Text>
                    ) : (
                        <Text className="text-gray-400 text-base italic font-sans">
                            No description added.
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Full Screen Image Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black justify-center items-center relative">
                    <StatusBar hidden />
                    <TouchableOpacity
                        className="absolute top-12 left-6 z-50 p-2 bg-black/50 rounded-full"
                        onPress={() => setModalVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>

                    {imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}
