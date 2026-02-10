import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform } from 'react-native';
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { EventService } from '../../services/eventService';
import { useAuth } from '../../components/ctx/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddEventScreen() {
    const router = useRouter();
    const { user, coupleId } = useAuth();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS
        setDate(currentDate);
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ title: 'Add Memory', headerBackTitle: 'Cancel' }} />
            <ScrollView className="p-4">

                {/* Image Picker */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full h-64 bg-gray-100 rounded-lg justify-center items-center mb-6 overflow-hidden border border-gray-200"
                >
                    {image ? (
                        <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="items-center">
                            <Ionicons name="camera" size={40} color="gray" />
                            <Text className="text-gray-500 mt-2">Tap to select photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Date Picker */}
                <View className="mb-6">
                    <Text className="text-gray-600 mb-2 font-medium">Date</Text>
                    {Platform.OS === 'android' && (
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                            <Text>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    )}

                    {(showDatePicker || Platform.OS === 'ios') && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            is24Hour={true}
                            display="default"
                            onChange={onChangeDate}
                            style={Platform.OS === 'ios' ? { alignSelf: 'flex-start' } : {}}
                        />
                    )}
                </View>

                {/* Description Input */}
                <View className="mb-8">
                    <Text className="text-gray-600 mb-2 font-medium">Description</Text>
                    <TextInput
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-32"
                        placeholder="Write about this memory..."
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`py-4 rounded-full items-center ${isSubmitting ? 'bg-gray-300' : 'bg-primary'}`}
                    style={{ backgroundColor: isSubmitting ? '#ccc' : '#f4256a' }} // Tailwind color fallback
                >
                    {isSubmitting ? (
                        <Text className="text-white font-bold text-lg">Saving...</Text>
                    ) : (
                        <Text className="text-white font-bold text-lg">Save Memory</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
