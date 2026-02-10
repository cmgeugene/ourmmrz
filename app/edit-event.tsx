import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { EventService } from '../services/eventService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Params are strings, so we need to parse them
    const id = params.id as string;
    const initialDescription = params.description as string;
    const initialDate = params.event_date as string;
    const imagePath = params.image_path as string;

    const [description, setDescription] = useState(initialDescription || '');
    const [date, setDate] = useState(new Date(initialDate || Date.now()));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const imageUrl = imagePath ? EventService.getImageUrl(imagePath) : null;

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await EventService.updateEvent(id, {
                description,
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
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

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
