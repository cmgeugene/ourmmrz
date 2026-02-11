import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { EventService } from '../services/eventService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { PLACE_CATEGORIES } from '../constants/categories';

export default function EditEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Params are strings, so we need to parse them
    const id = params.id as string;
    const initialDescription = params.description as string;
    const initialDate = params.event_date as string;
    const initialLocation = params.location as string;
    const imagePath = params.image_path as string;
    // Parse initial keywords if available (might come as JSON string or array depending on router)
    // For now assuming it might be passed, or we fetch it. 
    // Ideally we should fetch the full event details here to be safe, but for now let's use params + defaults
    // If keywords are not passed in params (which they likely aren't yet in timeline.tsx), we need to fetch or defaulting to empty
    // TODO: Fetch event details by ID to get keywords if not passed
    const initialKeywordsIdx = params.keywords ? (typeof params.keywords === 'string' ? JSON.parse(params.keywords) : params.keywords) : [];

    const [description, setDescription] = useState(initialDescription || '');
    const [location, setLocation] = useState(initialLocation || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>(initialKeywordsIdx || []);
    const [date, setDate] = useState(new Date(initialDate || Date.now()));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await EventService.updateEvent(id, {
                description,
                location,
                keywords: selectedKeywords,
                event_date: date.toISOString(),
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
            <ScrollView className="p-4">

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
                    <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                            <Ionicons name="location-outline" size={18} color="#3B82F6" />
                        </View>
                        <Text className="text-gray-900 font-bold font-sans text-base">Location</Text>
                    </View>
                    <TextInput
                        className="bg-gray-50 p-3 rounded-xl font-sans text-gray-900 text-base"
                        placeholder="Where did this happen?"
                        placeholderTextColor="#9CA3AF"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>

                {/* Categories Section */}
                <View className="mb-6">
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
                {uniqueActiveKeywords.length > 0 && (
                    <View className="mb-6">
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
                )}

                {/* Selected Keywords Chips (Above Caption) */}
                {selectedKeywords.length > 0 && (
                    <View className="flex-row flex-wrap mb-2 ml-1">
                        {selectedKeywords.map((keyword, index) => (
                            <View key={`selected-${keyword}-${index}`} className="mr-2 mb-2 bg-pink-100 px-2 py-1 rounded-md">
                                <Text className="text-pink-600 text-xs font-bold">#{keyword}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Description Input */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold font-sans text-base mb-3 ml-1">Caption</Text>
                    <TextInput
                        className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm h-40 font-sans text-gray-900 text-base leading-relaxed"
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

            </ScrollView>
        </View>
    );
}
