import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, SafeAreaView, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { EventService } from '../services/eventService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { PLACE_CATEGORIES } from '../constants/categories';
import { convertKATECHtoWGS84 } from '../utils/coordinate';
import { StarRatingInput } from '../components/StarRating';

// Naver API Keys
const NAVER_SEARCH_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID;
const NAVER_SEARCH_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET;
const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
const NAVER_MAP_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_SECRET;

interface SearchResult {
    title: string;
    link: string;
    category: string;
    description: string;
    telephone: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
}

export default function EditEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Params are strings, so we need to parse them
    const id = params.id as string;
    const initialDescription = params.description as string;
    const initialDate = params.event_date as string;
    const initialLocation = params.location as string;
    const initialRating = params.rating ? parseFloat(params.rating as string) : 0;
    const initialLatitude = params.latitude ? parseFloat(params.latitude as string) : null;
    const initialLongitude = params.longitude ? parseFloat(params.longitude as string) : null;
    const imagePath = params.image_path as string;
    const initialCategory = params.category as string;

    // Parse initial keywords
    const initialKeywordsIdx = params.keywords ? (typeof params.keywords === 'string' ? JSON.parse(params.keywords) : params.keywords) : [];

    const [description, setDescription] = useState(initialDescription || '');
    const [location, setLocation] = useState(initialLocation || '');
    const [latitude, setLatitude] = useState<number | null>(initialLatitude);
    const [longitude, setLongitude] = useState<number | null>(initialLongitude);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>(initialKeywordsIdx || []);
    const [date, setDate] = useState(new Date(initialDate || Date.now()));
    const [rating, setRating] = useState<number>(initialRating || 0);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Modal State
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initialize categories based on keywords
    useEffect(() => {
        if (selectedKeywords.length > 0) {
            const categoriesToSelect = new Set<string>();
            selectedKeywords.forEach(keyword => {
                PLACE_CATEGORIES.forEach(cat => {
                    if (cat.keywords.includes(keyword)) {
                        categoriesToSelect.add(cat.id);
                    }
                });
            });
            setSelectedCategories(Array.from(categoriesToSelect));
        }
    }, []);

    const imageUrl = imagePath ? EventService.getImageUrl(imagePath) : null;

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        if (!NAVER_SEARCH_CLIENT_ID || !NAVER_SEARCH_CLIENT_SECRET) {
            Alert.alert('Configuration Error', 'Naver Search API keys are missing.');
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(searchQuery)}&display=5`, {
                method: 'GET',
                headers: {
                    'X-Naver-Client-Id': NAVER_SEARCH_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_SEARCH_CLIENT_SECRET,
                },
            });

            const data = await response.json();
            if (data.items) {
                setSearchResults(data.items);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Failed to search location.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleCloseSearchModal = () => {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };

    const handleSelectLocation = (item: SearchResult) => {
        // Convert KATECH to WGS84
        const { latitude, longitude } = convertKATECHtoWGS84(item.mapx, item.mapy);

        // Remove HTML tags from title
        const cleanTitle = item.title.replace(/<[^>]+>/g, '');

        setLocation(cleanTitle);
        setLatitude(latitude);
        setLongitude(longitude);
        handleCloseSearchModal();
    };

    const getStaticMapUrl = (lat: number, lng: number) => {
        if (!NAVER_MAP_CLIENT_ID) return null;
        return `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=600&h=300&center=${lng},${lat}&level=16&markers=type:d%7Csize:mid%7Cpos:${lng} ${lat}|label:${encodeURIComponent(location)}&X-NCP-APIGW-API-KEY-ID=${NAVER_MAP_CLIENT_ID}`;
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await EventService.updateEvent(id, {
                description,
                location,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
                keywords: selectedKeywords,
                event_date: date.toISOString(),
                rating: rating > 0 ? rating : undefined,
            });

            Alert.alert('Success', 'Memory updated!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update memory. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        setDate(currentDate);
    };

    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker);
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords(prev => {
            if (prev.includes(keyword)) {
                return prev.filter(k => k !== keyword);
            } else {
                return [...prev, keyword];
            }
        });
    };

    // Get all keywords from selected categories
    const activeKeywords = PLACE_CATEGORIES
        .filter(cat => selectedCategories.includes(cat.id))
        .flatMap(cat => cat.keywords);

    // Filter unique keywords
    const uniqueActiveKeywords = [...new Set(activeKeywords)];

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ title: 'Edit Memory', presentation: 'modal' }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView className="p-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Image Display (Read-only) */}
                    {imageUrl && (
                        <View className="w-full h-64 bg-gray-100 rounded-lg justify-center items-center mb-6 overflow-hidden border border-gray-200">
                            <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                        </View>
                    )}

                    {/* Date Picker Section */}
                    <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <TouchableOpacity onPress={toggleDatePicker} className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                                </View>
                                <Text className="text-gray-900 font-bold font-sans text-base">Date</Text>
                            </View>
                            <View className="bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Text className="font-sans text-gray-900 text-base font-medium">{date.toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Date Picker Component */}
                        {(showDatePicker) && (
                            <View className="mt-4 items-center">
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={date}
                                    mode="date"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onChangeDate}
                                    style={Platform.OS === 'ios' ? { width: '100%', height: 120 } : undefined} // Add height for iOS Spinner
                                    themeVariant="light"
                                    accentColor="#3B82F6"
                                />
                            </View>
                        )}
                    </View>

                    {/* Location Input */}
                    <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <View className="flex-row items-center mb-2 justify-between">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="location-outline" size={18} color="#3B82F6" />
                                </View>
                                <Text className="text-gray-900 font-bold font-sans text-base">Location</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSearchModal(true)} className="bg-blue-50 px-3 py-1 rounded-lg">
                                <Text className="text-blue-500 font-bold text-sm">Search</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowSearchModal(true)}>
                            <Text className={`p-3 rounded-xl font-sans text-base ${location ? 'text-gray-900' : 'text-gray-400'}`}>
                                {location || "Where did this happen?"}
                            </Text>
                        </TouchableOpacity>

                        {/* Static Map Preview */}
                        {(latitude && longitude) ? (
                            <View className="mt-3 rounded-xl overflow-hidden h-48 w-full bg-gray-100 relative">
                                <Image
                                    source={{
                                        uri: `https://maps.apigw.ntruss.com/map-static/v2/raster?w=600&h=450&center=${longitude},${latitude}&level=17&markers=type:d%7Csize:mid%7Cpos:${longitude}%20${latitude}`,
                                        headers: {
                                            'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_CLIENT_ID || '',
                                            'X-NCP-APIGW-API-KEY': NAVER_MAP_CLIENT_SECRET || ''
                                        }
                                    }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                    onError={(e) => {
                                        console.log("Static Map Load Error:", e.nativeEvent.error);
                                    }}
                                />
                                {/* Map Overlay to prevent interaction confusion if needed */}
                                <View className="absolute inset-0 border border-black/5 rounded-xl pointer-events-none" />
                            </View>
                        ) : null}
                    </View>



                    {/* Rating Section */}
                    <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex-col items-center">
                        <View className="w-full flex-row items-center mb-2">
                            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="star-outline" size={18} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-bold font-sans text-base">Rate this memory</Text>
                        </View>
                        <StarRatingInput rating={rating} onRatingChange={setRating} size={40} />
                    </View>

                    {/* Categories Section */}
                    <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="grid-outline" size={18} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-bold font-sans text-base">Place Category</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {PLACE_CATEGORIES.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    onPress={() => toggleCategory(category.id)}
                                    className={`mr-2 px-4 py-2 rounded-full border flex-row items-center ${selectedCategories.includes(category.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'}`}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={16}
                                        color={selectedCategories.includes(category.id) ? 'white' : '#4B5563'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text className={`font-sans font-bold ${selectedCategories.includes(category.id) ? 'text-white' : 'text-gray-600'}`}>
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Keywords Section (Dynamic) */}
                    {
                        uniqueActiveKeywords.length > 0 && (
                            <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="pricetags-outline" size={18} color="#3B82F6" />
                                    </View>
                                    <Text className="text-gray-900 font-bold font-sans text-base">Keywords</Text>
                                </View>
                                <View className="flex-row flex-wrap">
                                    {uniqueActiveKeywords.map((keyword, index) => (
                                        <TouchableOpacity
                                            key={`${keyword}-${index}`}
                                            onPress={() => toggleKeyword(keyword)}
                                            className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${selectedKeywords.includes(keyword) ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'}`}
                                        >
                                            <Text className={`font-sans text-sm ${selectedKeywords.includes(keyword) ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>
                                                #{keyword}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )
                    }

                    {/* Selected Keywords Chips (Above Caption) */}
                    {
                        selectedKeywords.length > 0 && (
                            <View className="flex-row flex-wrap mb-2 ml-1">
                                {selectedKeywords.map((keyword, index) => (
                                    <View key={`selected-${keyword}-${index}`} className="mr-2 mb-2 bg-pink-100 px-2 py-1 rounded-md">
                                        <Text className="text-pink-600 text-xs font-bold">#{keyword}</Text>
                                    </View>
                                ))}
                            </View>
                        )
                    }

                    {/* Description Input */}
                    <View className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-bold font-sans text-base">Caption</Text>
                        </View>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-xl text-gray-900 h-40 font-sans text-base leading-relaxed"
                            placeholder="Write about this memory..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSubmitting}
                        className={`py-4 rounded-full items-center ${isSubmitting ? 'bg-gray-300' : 'bg-primary'}`}
                        style={{ backgroundColor: isSubmitting ? '#ccc' : '#f4256a' }}
                    >
                        {isSubmitting ? (
                            <Text className="text-white font-bold text-lg">Saving...</Text>
                        ) : (
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    <View className="h-20" />
                </ScrollView >
            </KeyboardAvoidingView>

            {/* Search Modal */}
            < Modal
                visible={showSearchModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSearchModal(false)
                }
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-1" style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 16 }}>
                        <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
                            <TouchableOpacity onPress={handleCloseSearchModal} className="mr-4">
                                <Ionicons name="close" size={28} color="#1E293B" />
                            </TouchableOpacity>
                            <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
                                <Ionicons name="search" size={20} color="#9CA3AF" className="mr-2" />
                                <TextInput
                                    className="flex-1 font-sans text-base text-gray-900 h-10"
                                    placeholder="Search location (e.g. Starbucks)"
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity onPress={handleSearch} className="ml-3">
                                <Text className="text-blue-500 font-bold text-base">Search</Text>
                            </TouchableOpacity>
                        </View>

                        {isSearching ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, index) => index.toString()}
                                contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="py-4 border-b border-gray-50"
                                        onPress={() => handleSelectLocation(item)}
                                    >
                                        <Text className="text-gray-900 font-bold text-base mb-1">{item.title.replace(/<[^>]+>/g, '')}</Text>
                                        <Text className="text-gray-500 text-sm">{item.roadAddress || item.address}</Text>
                                        <Text className="text-gray-400 text-xs mt-1">{item.category}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View className="mt-20 items-center">
                                        <Text className="text-gray-400 text-base">No results found</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </SafeAreaView>
            </Modal >
        </View >
    );
}
