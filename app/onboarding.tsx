import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Share } from 'react-native';
import { useAuth } from '../components/ctx/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const createInvite = async () => {
        try {
            setLoading(true);
            // Generate a random 6-character code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Create couple in DB
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({ invite_code: code })
                .select()
                .single();

            if (coupleError) throw coupleError;

            // Update user with couple_id
            const { error: userError } = await supabase
                .from('users')
                .update({ couple_id: couple.id })
                .eq('id', user.id);

            if (userError) throw userError;

            setGeneratedCode(code);
            await refreshProfile(); // Refresh context to update UI or redirect (though redirect happens in layout)
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const joinCouple = async () => {
        if (!inviteCode) return;
        try {
            setLoading(true);

            // Find couple by code
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .select('*')
                .eq('invite_code', inviteCode.toUpperCase())
                .single();

            if (coupleError || !couple) {
                Alert.alert('Error', '유효하지 않은 초대 코드입니다.');
                return;
            }

            // Update user with couple_id
            const { error: userError } = await supabase
                .from('users')
                .update({ couple_id: couple.id })
                .eq('id', user.id);

            if (userError) throw userError;

            await refreshProfile();
            // Redirect handled by _layout structure
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const shareCode = async () => {
        if (generatedCode) {
            await Share.share({
                message: `우리 커플 앱 'ourmmrz'에 초대합니다! 초대 코드: ${generatedCode}`,
            });
        }
    }

    const connectWithSelf = async () => {
        try {
            setLoading(true);
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Create couple
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({ invite_code: code })
                .select()
                .single();

            if (coupleError) throw coupleError;

            // 2. Update user (connect to self)
            const { error: userError } = await supabase
                .from('users')
                .update({ couple_id: couple.id })
                .eq('id', user.id);

            if (userError) throw userError;

            Alert.alert('Success', '테스트 모드로 연결되었습니다.', [
                { text: '확인', onPress: () => refreshProfile() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white px-6 pt-20">
            <Text className="text-3xl font-bold text-gray-900 mb-2">파트너 연결</Text>
            <Text className="text-gray-500 mb-10">
                연인이 보낸 초대 코드를 입력하거나,{'\n'}새로운 코드를 생성하여 연인을 초대하세요.
            </Text>

            {/* Code Input Section */}
            <View className="mb-8">
                <Text className="font-semibold mb-2 text-gray-700">초대 코드 입력하기</Text>
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl text-lg mb-4"
                    placeholder="초대 코드 6자리"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                />
                <TouchableOpacity
                    onPress={joinCouple}
                    disabled={loading || !inviteCode}
                    className={`py-4 rounded-xl items-center ${loading || !inviteCode ? 'bg-gray-300' : 'bg-primary'
                        }`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">연결하기</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-8">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-400">또는</Text>
                <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Code Generation Section */}
            <View>
                <Text className="font-semibold mb-2 text-gray-700">새 초대 코드 만들기</Text>

                {!generatedCode ? (
                    <TouchableOpacity
                        onPress={createInvite}
                        disabled={loading}
                        className="border-2 border-gray-900 py-4 rounded-xl items-center"
                    >
                        {loading ? <ActivityIndicator color="black" /> : <Text className="text-gray-900 font-bold text-lg">코드 생성하기</Text>}
                    </TouchableOpacity>
                ) : (
                    <View className="items-center bg-gray-50 p-6 rounded-xl">
                        <Text className="text-gray-500 mb-2">나의 초대 코드</Text>
                        <Text className="text-4xl font-bold text-primary mb-6 tracking-widest">{generatedCode}</Text>
                        <TouchableOpacity onPress={shareCode} className="flex-row items-center">
                            <Text className="text-blue-500 font-semibold text-lg">초대 코드 공유하기</Text>
                        </TouchableOpacity>
                        <Text className="text-xs text-gray-400 mt-4 text-center">
                            파트너가 이 코드를 입력하면{'\n'}자동으로 연결됩니다.
                        </Text>
                    </View>
                )}
            </View>

            {/* Test Mode */}
            <TouchableOpacity onPress={connectWithSelf} className="mt-10 mb-10 self-center">
                <Text className="text-gray-400 underline text-sm">테스트용: 나 혼자 연결하기</Text>
            </TouchableOpacity>
        </View>
    );
}
