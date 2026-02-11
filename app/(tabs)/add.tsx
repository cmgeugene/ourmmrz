import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { EventService } from '../../services/eventService';
import { useAuth } from '../../components/ctx/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PLACE_CATEGORIES } from '../../constants/categories';

export default function AddEventScreen() {
    const router = useRouter();
    const { refresh } = useLocalSearchParams();
    const { user, coupleId } = useAuth();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when entering with a new refresh timestamp
    useEffect(() => {
        if (refresh) {
            setImage(null);
            setDescription('');
            setLocation('');
            setSelectedCategories([]);
            setSelectedKeywords([]);
            setDate(new Date());
            setIsSubmitting(false);
        }
    }, [refresh]);

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
                keywords: selectedKeywords,
                event_date: date.toISOString(),
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
                        placeholder="Write something about this moment..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
