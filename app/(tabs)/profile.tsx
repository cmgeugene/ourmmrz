import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../components/ctx/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function ProfileScreen() {
    const { signOut, user, coupleId } = useAuth();

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
                {/* Profile Card */}
                <View className="bg-white p-6 rounded-3xl shadow-card mb-6 items-center">
                    <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-4">
                        <Ionicons name="person" size={40} color="#3B82F6" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 font-sans mb-1">{user?.email?.split('@')[0]}</Text>
                    <Text className="text-gray-500 font-sans mb-4">{user?.email}</Text>

                    <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-xl">
                        <Ionicons name="heart" size={16} color="#3B82F6" />
                        <Text className="ml-2 text-gray-600 font-sans text-sm">Couple ID: {coupleId?.substring(0, 8)}...</Text>
                    </View>
                </View>

                {/* Settings / Actions */}
                <View className="bg-white rounded-3xl shadow-card overflow-hidden mb-8">
                    <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-gray-50">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="settings-outline" size={18} color="#4B5563" />
                            </View>
                            <Text className="text-gray-900 font-medium font-sans text-base">Settings</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="flex-row items-center justify-between p-5"
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
        </View>
    );
}
