import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native'; // Use RN hook or your custom hook
import './global.css';

import { AuthProvider, useAuth } from '../components/ctx/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
    const segments = useSegments();
    const router = useRouter();
    const { session, coupleId, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)'; // e.g., login
        const inTabsGroup = segments[0] === '(tabs)'; // e.g., main app

        if (!session) {
            // If not signed in and not in auth group, redirect to login
            if (segments[0] !== 'login') {
                router.replace('/login');
            }
        } else if (session && !coupleId) {
            // Signed in but no couple connected -> go to onboarding
            if (segments[0] !== 'onboarding') {
                router.replace('/onboarding');
            }
        } else if (session && coupleId) {
            // Signed in and couple connected
            // Redirect to tabs if not already there AND not in allowed screens
            if (segments[0] !== '(tabs)' && segments[0] !== 'edit-event' && segments[0] !== 'view-event') {
                router.replace('/(tabs)');
            }
        }
    }, [session, coupleId, isLoading, segments]);
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const [loaded, error] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_700Bold,
    });

    useProtectedRoute();

    useEffect(() => {
        if (loaded || error) {
            console.log('RootLayout: Fonts loaded (or error), hiding splash screen');
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="edit-event" options={{ presentation: 'modal' }} />
                <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
