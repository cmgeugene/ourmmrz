import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#f4256a', // Primary color
                headerShown: false,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Timeline',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    href: null, // Hide from tab bar, accessed via header button in index
                    // title: 'Add Memory',
                    // tabBarStyle: { display: 'none' }, // Hide tab bar on this screen
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
