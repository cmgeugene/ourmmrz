import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../../components/ctx/AuthContext';

export default function TimelineScreen() {
    const { user } = useAuth();

    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-2xl font-bold">Timeline</Text>
            <Text className="text-gray-500">Welcome, {user?.email}</Text>
        </View>
    );
}
