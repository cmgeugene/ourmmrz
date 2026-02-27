import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Platform, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../../components/ctx/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { CoupleService } from '../../services/coupleService';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile } from '../../types';

export default function ProfileScreen() {
    const { signOut, user, coupleId } = useAuth();
    const [firstMetDate, setFirstMetDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Profile Data
    const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Edit Nickname
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [isSavingNickname, setIsSavingNickname] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (coupleId && user) {
                loadData();
            }
        }, [coupleId, user])
    );

    const loadData = async () => {
        if (!coupleId || !user) return;
        setIsLoadingProfile(true);
        try {
            // 1. Load Couple Data (First Met)
            const couple = await CoupleService.getCouple(coupleId);
            if (couple && couple.first_met_date) {
                setFirstMetDate(new Date(couple.first_met_date));
            }

            // 2. Load My Profile
            const me = await CoupleService.getUser(user.id);
            setMyProfile(me);
            if (me?.nickname) setNewNickname(me.nickname);

            // 3. Load Partner Profile
            const partner = await CoupleService.getPartner(coupleId, user.id);
            setPartnerProfile(partner);

        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleDateChange = async (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || firstMetDate;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (currentDate) {
            setFirstMetDate(currentDate);
            if (Platform.OS === 'android' && event.type !== 'dismissed') {
                saveDate(currentDate);
            }
        }
    };

    const saveDate = async (dateToSave: Date) => {
        if (!coupleId) return;
        setIsUpdating(true);
        try {
            await CoupleService.updateFirstMetDate(coupleId, dateToSave.toISOString());
            Alert.alert('Success', 'Anniversary date updated!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update anniversary date');
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmIOSDate = () => {
        if (firstMetDate) {
            saveDate(firstMetDate);
            setShowDatePicker(false);
        }
    };

    const pickProfileImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && user) {
            setIsUpdating(true);
            try {
                const uri = result.assets[0].uri;
                // Upload image
                const path = await CoupleService.uploadProfileImage(user.id, uri);
                const publicUrl = CoupleService.getImageUrl(path);

                // Update profile
                await CoupleService.updateProfile(user.id, { profile_image_url: publicUrl });

                // Reload
                loadData();
                Alert.alert('Success', 'Profile image updated!');
            } catch (error) {
                Alert.alert('Error', 'Failed to update profile image');
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const saveNickname = async () => {
        if (!user || !newNickname.trim()) return;
        setIsSavingNickname(true);
        try {
            await CoupleService.updateProfile(user.id, { nickname: newNickname.trim() });
            setShowNicknameModal(false);
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update nickname');
        } finally {
            setIsSavingNickname(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: signOut }
            ]
        );
    };

    return (
        <View className="flex-1 bg-surface">
            {/* Header */}
            <View className="pt-14 pb-6 px-6 bg-white shadow-sm z-10 mb-6 rounded-b-3xl">
                <Text className="text-2xl font-bold text-gray-900 font-sans">Profile</Text>
            </View>

            <ScrollView className="flex-1 px-6">

                {/* Couple Card */}
                <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100/40 border border-gray-50 mb-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="people" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-extrabold font-sans text-xl">Our Connection</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-gray-100 mb-6" />

                    <View className="flex-row items-center justify-between px-2">
                        {/* Me */}
                        <View className="items-center">
                            <TouchableOpacity onPress={pickProfileImage} className="relative">
                                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-sm">
                                    {myProfile?.profile_image_url ? (
                                        <Image source={{ uri: myProfile.profile_image_url }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Ionicons name="person" size={32} color="#9CA3AF" />
                                    )}
                                </View>
                                <View className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                    <Ionicons name="camera" size={12} color="#4B5563" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowNicknameModal(true)} className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full">
                                <Text className="text-gray-900 font-bold font-sans text-sm">
                                    {myProfile?.nickname || "Me"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Heart */}
                        <View className="items-center justify-center -mt-6">
                            <Ionicons name="heart" size={24} color="#EC4899" />
                            <View className="h-0.5 w-12 bg-pink-100 absolute -z-10" />
                        </View>

                        {/* Partner */}
                        <View className="items-center">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-sm">
                                {partnerProfile?.profile_image_url ? (
                                    <Image source={{ uri: partnerProfile.profile_image_url }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <Ionicons name="person" size={32} color="#9CA3AF" />
                                )}
                            </View>
                            <View className="bg-gray-50 px-3 py-1 rounded-full">
                                <Text className="text-gray-900 font-bold font-sans text-sm">
                                    {partnerProfile?.nickname || "Partner"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Couple ID */}
                    <View className="mt-8 flex-row items-center justify-center">
                        <View className="bg-blue-50/50 px-5 py-3 rounded-2xl flex-row items-center border border-blue-100">
                            <Ionicons name="sparkles" size={16} color="#3B82F6" />
                            <Text className="ml-2 text-blue-600 font-sans text-sm font-bold">
                                {coupleId ? `Couple ID: ${coupleId.substring(0, 8)}` : 'No Couple ID'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Anniversary Section */}
                <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100/40 border border-gray-50 mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-pink-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="calendar" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-extrabold font-sans text-xl">First Met</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-gray-100 mb-4" />

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(!showDatePicker)}
                        className="flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-pink-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="heart" size={20} color="#EC4899" />
                            </View>
                            <Text className="text-gray-600 font-medium font-sans">
                                {firstMetDate ? firstMetDate.toLocaleDateString() : 'Set Date'}
                            </Text>
                        </View>
                        <Text className="text-blue-500 font-bold font-sans">Change</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <View className="mt-4">
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={firstMetDate || new Date()}
                                mode="date"
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                style={Platform.OS === 'ios' ? { width: '100%', height: 120 } : undefined}
                                themeVariant="light"
                                accentColor="#EC4899"
                            />
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    onPress={confirmIOSDate}
                                    disabled={isUpdating}
                                    className="bg-primary py-3 rounded-xl items-center mt-2"
                                    style={{ backgroundColor: '#F43F5E' }}
                                >
                                    <Text className="text-white font-bold font-sans">
                                        {isUpdating ? 'Saving...' : 'Confirm Date'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Settings / Actions */}
                <View className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-100/40 border border-gray-50 mb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="settings" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-900 font-extrabold font-sans text-xl">Account</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-gray-100 mb-4" />
                    <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/50 mb-4">
                        <Text className="text-gray-900 font-bold font-sans text-base mb-1">{user?.email}</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="logo-google" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                            <Text className="text-gray-500 font-medium font-sans text-sm">Signed in via Google</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="flex-row items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100"
                    >
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                            </View>
                            <Text className="text-red-500 font-medium font-sans text-base">Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Nickname Modal */}
            <Modal
                transparent={true}
                visible={showNicknameModal}
                animationType="fade"
                onRequestClose={() => setShowNicknameModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-3xl p-6">
                        <Text className="text-xl font-bold text-gray-900 mb-4 font-sans justify-center text-center">Change Nickname</Text>

                        <TextInput
                            value={newNickname}
                            onChangeText={setNewNickname}
                            placeholder="Enter new nickname"
                            className="bg-gray-50 p-4 rounded-xl text-gray-900 font-sans text-base mb-4 border border-gray-100"
                            autoFocus
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowNicknameModal(false)}
                                className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold font-sans">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveNickname}
                                disabled={isSavingNickname || !newNickname.trim()}
                                className={`flex-1 py-3 rounded-xl items-center ${!newNickname.trim() ? 'bg-gray-300' : 'bg-blue-500'}`}
                            >
                                {isSavingNickname ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-bold font-sans">Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
