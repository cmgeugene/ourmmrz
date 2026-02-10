import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AppState } from 'react-native';

// Google Signin Configuration
GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/userinfo.email'], // what API you want to access on behalf of the user, default is email and profile
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use env variable
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Required for iOS native sign in
});

type AuthContextType = {
    session: Session | null;
    user: any | null;
    coupleId: string | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    coupleId: null,
    isLoading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('AuthContext: useEffect started');
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthContext: getSession result', !!session);
            setSession(session);
            if (session) {
                console.log('AuthContext: Fetching profile for', session.user.id);
                fetchProfile(session.user.id, session.user.email);
            } else {
                console.log('AuthContext: No session, setting isLoading false');
                setIsLoading(false);
            }
        }).catch(err => {
            console.error('AuthContext: getSession error', err);
            setIsLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthContext: onAuthStateChange', _event, !!session);
            setSession(session);
            if (session) {
                fetchProfile(session.user.id, session.user.email);
            } else {
                setUser(null);
                setCoupleId(null);
                setIsLoading(false);
            }
        });

        // Clean up the listener when the component unmounts
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string, email?: string) => {
        try {
            let { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            // If profile doesn't exist (PGRST116), create it
            if (error && error.code === 'PGRST116') {
                console.log('Profile missing, creating new profile...');
                const { data: newData, error: insertError } = await supabase
                    .from('users')
                    .insert([{ id: userId, email: email }])
                    .select()
                    .single();

                if (insertError) {
                    // Check for duplicate key error (race condition)
                    if (insertError.code === '23505') {
                        const { data: retryData, error: retryError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', userId)
                            .single();

                        if (retryError) {
                            console.error('Error fetching profile after duplicate:', retryError);
                            return;
                        }
                        data = retryData;
                        error = null;
                    } else {
                        console.error('Error creating profile:', insertError);
                        return;
                    }
                }
                data = newData;
                error = null;
            }

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setUser(data);
                setCoupleId(data?.couple_id || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (session?.user.id) {
            await fetchProfile(session.user.id);
        }
    }

    const signInWithGoogle = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
                console.error(error);
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                coupleId,
                isLoading,
                signInWithGoogle,
                signOut,
                refreshProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
