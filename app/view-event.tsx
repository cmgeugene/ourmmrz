import { View, Text, Image, ScrollView, TouchableOpacity, Alert, Modal, StatusBar, Linking } from 'react-native';
import React, { useState } from 'react';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EventService } from '../services/eventService';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// Naver API Keys
const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
const NAVER_MAP_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_SECRET;

export default function ViewEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const id = params.id as string;

    // State to hold event data (initialized from params, but can be updated via fetch)
    const [eventData, setEventData] = useState<any>({
        description: params.description,
        event_date: params.event_date,
        location: params.location,
        latitude: params.latitude ? parseFloat(params.latitude as string) : null,
        longitude: params.longitude ? parseFloat(params.longitude as string) : null,
        image_path: params.image_path,
        keywords: params.keywords ? (typeof params.keywords === 'string' ? JSON.parse(params.keywords) : params.keywords) : []
    });

    // Fetch full event data whenever the screen is focused (to handle updates from Edit screen)
    useFocusEffect(
        React.useCallback(() => {
            if (id) {
                loadEventData();
            }
        }, [id])
    );

    const loadEventData = async () => {
        try {
            const data = await EventService.getEventById(id);
            if (data) {
                setEventData({
                    description: data.description,
                    event_date: data.event_date,
                    location: data.location,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    image_path: data.image_path,
                    keywords: data.keywords
                });
            }
        } catch (error) {
            console.error("Failed to load event:", error);
        }
    };

    const imageUrl = eventData.image_path ? EventService.getImageUrl(eventData.image_path) : null;
    const date = new Date(eventData.event_date || new Date());
    const [modalVisible, setModalVisible] = useState(false);

    const handleEdit = () => {
        router.push({
            pathname: '/edit-event',
            params: {
                id,
                description: eventData.description || '',
                event_date: eventData.event_date,
                location: eventData.location || '',
                latitude: eventData.latitude?.toString(),
                longitude: eventData.longitude?.toString(),
                image_path: eventData.image_path || '',
                keywords: JSON.stringify(eventData.keywords || [])
            }
        });
    };

    // Static Map URL generator
    const getStaticMapUrl = (lat: number, lng: number) => {
        if (!NAVER_MAP_CLIENT_ID) return null;
        // Naver Static Map API v2
        return `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=600&h=300&center=${lng},${lat}&level=16&markers=type:t|size:mid|pos:${lng} ${lat}|label:${encodeURIComponent(eventData.location || 'Location')}&X-NCP-APIGW-API-KEY-ID=${NAVER_MAP_CLIENT_ID}`;
    };

    const openMapApp = () => {
        if (!eventData.latitude || !eventData.longitude) return;
        // Open Naver Map if possible, fall back to browser or others
        // URL Scheme for Naver Map: nmap://place?lat={lat}&lng={lng}&name={name}&appname={appname}
        const label = eventData.location || 'Memory Location';
        const url = `nmap://place?lat=${eventData.latitude}&lng=${eventData.longitude}&name=${encodeURIComponent(label)}&appname=com.anonymous.ourmmrz`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback to Web
                Linking.openURL(`https://map.naver.com/v5/?c=${eventData.longitude},${eventData.latitude},15,0,0,0,dh`);
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
                        <View className="flex-row items-baseline mb-4">
                            <Text className="text-3xl font-bold text-gray-900 font-sans mr-2">
                                {format(date, 'yyyy.MM.dd', { locale: ko })}
                            </Text>
                            <Text className="text-xl text-gray-500 font-medium font-sans">
                                {format(date, 'EEEE', { locale: ko })}
                            </Text>
                        </View>

                        {eventData.location ? (
                            <View className="flex-row items-center">
                                <Ionicons name="location-sharp" size={18} color="#3B82F6" className="mr-1" />
                                <Text className="text-gray-600 font-sans text-base">{eventData.location}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Static Map Display */}
                    {(eventData.latitude && eventData.longitude) ? (
                        <TouchableOpacity
                            onPress={openMapApp}
                            className="mb-6 rounded-xl overflow-hidden h-48 w-full bg-gray-100 relative shadow-sm"
                        >
                            <Image
                                source={{
                                    uri: `https://maps.apigw.ntruss.com/map-static/v2/raster?w=600&h=450&center=${eventData.longitude},${eventData.latitude}&level=16&markers=type:d%7Csize:mid%7Cpos:${eventData.longitude}%20${eventData.latitude}`,
                                    headers: {
                                        'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_CLIENT_ID || '',
                                        'X-NCP-APIGW-API-KEY': NAVER_MAP_CLIENT_SECRET || ''
                                    }
                                }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={(e) => console.log("Static Map Load Error in View:", e.nativeEvent.error)}
                            />
                            <View className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-md">
                                <Text className="text-xs font-bold text-gray-700">NAVER Map</Text>
                            </View>
                        </TouchableOpacity>
                    ) : null}

                    <View className="h-[1px] bg-gray-100 w-full mb-6" />

                    {/* Keywords */}
                    {eventData.keywords && eventData.keywords.length > 0 && (
                        <View className="flex-row flex-wrap mb-6">
                            {eventData.keywords.map((keyword: string, index: number) => (
                                <View key={index} className="mr-2 mb-2 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                                    <Text className="text-pink-600 text-sm font-bold">#{keyword}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    {eventData.description ? (
                        <Text className="text-gray-800 text-lg leading-loose font-sans">
                            {eventData.description}
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
