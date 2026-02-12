import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { EventService } from '../../services/eventService';
import { useAuth } from '../../components/ctx/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PLACE_CATEGORIES } from '../../constants/categories';
import { convertKATECHtoWGS84 } from '../../utils/coordinate';
import { StarRatingInput } from '../../components/StarRating';

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

export default function AddEventScreen() {
    const router = useRouter();
    const { refresh } = useLocalSearchParams();
    const { user, coupleId } = useAuth();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Modal State
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Reset form when entering with a new refresh timestamp OR whenever the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            // Check if we should preserve state (e.g. returning from image picker)
            // For now, let's reset to ensure clean state as requested. 
            // If image picker return causes issues, we might need a flag.
            // But since image picker is usually a modal or external activity, keeping it simple first.
            // Actually, image picker might NOT trigger unmount but might trigger focus.
            // Let's reset ONLY if we want a fresh start.
            // The user requested "initialization of modal", implies fresh start.

            // However, we must be careful not to clear state if we just picked an image.
            // A safer way is to check if we have data and if we just came from navigation.
            // But useFocusEffect runs on focus. 

            // Alternative: Reset only on mount? No, tab stays mounted.
            // Let's add a cleanup function or check navigation params.

            // If the user wants to "Reset", maybe we should just reset unless we are in the middle of editing?
            // "Designated date, location search -> selection -> map image display are still there."
            // This suggests they left the screen and came back.

            return () => {
                // Cleanup when leaving the screen
                setImage(null);
                setDescription('');
                setLocation('');
                setLatitude(null);
                setLongitude(null);
                setSelectedCategories([]);
                setSelectedKeywords([]);
                setDate(new Date());
                setRating(0);
                setIsSubmitting(false);
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
            };
        }, [])
    );

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        console.log('ImagePicker object keys:', Object.keys(ImagePicker));

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            // aspect: [4, 3], // Optional: constrain aspect ratio
            quality: 0.7, // Compress image quality to 70%
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

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
            console.log("Search API Response Items:", data.items ? data.items.length : "No items");
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
        console.log("handleSelectLocation triggered with item:", JSON.stringify(item));

        // Convert KATECH to WGS84
        // Note: Naver Search API returns integer strings for mapx/mapy.
        console.log("Raw mapx:", item.mapx, "Raw mapy:", item.mapy);

        const { latitude, longitude } = convertKATECHtoWGS84(item.mapx, item.mapy);
        console.log("Converted Lat:", latitude, "Converted Lng:", longitude);

        // Remove HTML tags from title (e.g. <b>Starbucks</b>)
        const cleanTitle = item.title.replace(/<[^>]+>/g, '');

        setLocation(cleanTitle);
        setLatitude(latitude);
        setLongitude(longitude);
        handleCloseSearchModal();
    };

    const handleSubmit = async () => {
        if (!coupleId || !user) return;
        if (!image) {
            Alert.alert('Image required', 'Please select an image for your memory.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload Image
            const imagePath = await EventService.uploadImage(coupleId, image);

            // 2. Create Event Record
            await EventService.createEvent({
                couple_id: coupleId,
                author_id: user.id,
                image_path: imagePath,
                description: description,
                location: location,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                keywords: selectedKeywords,
                keywords: selectedKeywords,
                event_date: date.toISOString(),
                rating: rating > 0 ? rating : undefined,
            });

            Alert.alert('Success', 'Memory added!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save memory. Please try again.');
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

    // Static Map URL generator
    const getStaticMapUrl = (lat: number, lng: number) => {
        if (!NAVER_MAP_CLIENT_ID) return null;
        // Naver Static Map API v2
        // Use 2x scale for retina displays (w=600&h=300 for 300x150 container?)
        // Let's stick to simple first.
        return `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=600&h=300&center=${lng},${lat}&level=16&markers=type:t|size:mid|pos:${lng} ${lat}|label:${encodeURIComponent(location)}&X-NCP-APIGW-API-KEY-ID=${NAVER_MAP_CLIENT_ID}`;
    };

    return (
        <View className="flex-1 bg-surface">
            {/* Custom Header */}
            <Stack.Screen options={{ headerShown: false }} />
            <View className="px-5 pt-14 pb-4 flex-row justify-between items-center bg-white z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="close" size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 font-sans">New Memory</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || !image} className={`${isSubmitting || !image ? 'opacity-50' : 'opacity-100'}`}>
                    <Text className="text-primary font-bold text-base font-sans">Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Image Picker */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full aspect-[4/3] bg-white rounded-3xl justify-center items-center mb-6 overflow-hidden shadow-sm border border-gray-100"
                >
                    {image ? (
                        <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="items-center">
                            <View className="w-16 h-16 bg-blue-50 rounded-full justify-center items-center mb-4">
                                <Ionicons name="image-outline" size={32} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-bold font-sans text-lg mb-1">Add Photo</Text>
                            <Text className="text-gray-400 font-sans text-sm">Tap to select from gallery</Text>
                        </View>
                    )}
                </TouchableOpacity>

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
                    <Text className="text-gray-900 font-bold font-sans text-base mb-2 self-start">Rate this memory</Text>
                    <StarRatingInput rating={rating} onRatingChange={setRating} size={40} />
                </View>

                {/* Categories Section */}
                <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                    <Text className="text-gray-900 font-bold font-sans text-base mb-3 ml-1">Place Category</Text>
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
                            <Text className="text-gray-900 font-bold font-sans text-base mb-3 ml-1">Keywords</Text>
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
                    <Text className="text-gray-900 font-bold font-sans text-base mb-3 ml-1">Caption</Text>
                    <TextInput
                        className="bg-gray-50 p-4 rounded-xl text-gray-900 h-40 font-sans text-base leading-relaxed"
                        placeholder="Write something about this moment..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View className="h-20" />
            </ScrollView >

            {/* Search Modal */}
            < Modal
                visible={showSearchModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSearchModal(false)
                }
            >
                <View className="flex-1 bg-white pt-6">
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
            </Modal >
        </View >
    );
}
