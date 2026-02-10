import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../components/ctx/AuthContext';
import { useRouter } from 'expo-router';
// import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
    const { signInWithGoogle, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                {/* <ActivityIndicator size="large" color="#f4256a" /> */}
                <Text className="mt-4 text-gray-500">잠시만 기다려주세요...</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 justify-center items-center bg-white px-6">
            <View className="items-center mb-12">
                <Text className="text-4xl font-bold text-primary mb-2">ourmmrz</Text>
                <Text className="text-gray-500 text-lg">우리만의 추억을 기록하세요</Text>
            </View>

            <TouchableOpacity
                onPress={() => signInWithGoogle()}
                className="bg-black py-4 px-8 rounded-full flex-row items-center space-x-3 w-full justify-center"
            >
                <Text className="text-white font-semibold text-lg">Google로 시작하기</Text>
            </TouchableOpacity>

            <View className="mt-8">
                <Text className="text-xs text-gray-400 text-center">
                    계속 진행하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
                </Text>
            </View>
        </View>
    );
}
