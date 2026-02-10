import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#3B82F6', // Blue-500
                tabBarInactiveTintColor: '#94A3B8', // Slate-400
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#EFF6FF', // Blue-50
                    backgroundColor: '#ffffff',
                    height: 85, // Standard height for bottom tabs
                    paddingTop: 10,
                    paddingBottom: 30, // Padding for iPhone home indicator
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: 10,
                    marginTop: 4,
                },
                headerShown: false,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: 'Timeline',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="gallery"
                options={{
                    title: 'Gallery',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "images" : "images-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
