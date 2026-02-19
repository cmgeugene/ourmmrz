import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View } from 'react-native';
import { useAuth } from '../../components/ctx/AuthContext';

export default function TabLayout() {
    const { session, isLoading } = useAuth();

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
                name="moments_tab"
                options={{
                    title: 'Moments',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "albums" : "albums-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={24} color={color} />
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
