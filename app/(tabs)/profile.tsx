import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../components/ctx/AuthContext';

export default function ProfileScreen() {
    const { signOut, user, coupleId } = useAuth();

    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold mb-4">Profile</Text>
            <Text className="mb-2">User: {user?.email}</Text>
            <Text className="mb-8">Couple ID: {coupleId}</Text>

            <TouchableOpacity
                onPress={() => signOut()}
                className="bg-red-500 py-3 px-6 rounded-full"
            >
                <Text className="text-white font-bold">Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}
