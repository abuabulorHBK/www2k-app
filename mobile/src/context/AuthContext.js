import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'buyer' | 'seller' | 'admin'
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check existing session on app launch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser(session.user);
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id);
                } else {
                    setUser(null);
                    setUserRole(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    async function fetchUserRole(userId) {
        try {
            const { data } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            setUserRole(data?.role || 'buyer');
        } catch {
            setUserRole('buyer');
        } finally {
            setLoading(false);
        }
    }

    // Send OTP to phone number
    async function sendOTP(phone) {
        const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
        const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
        });
        if (error) throw error;
        return formattedPhone;
    }

    // Verify OTP
    async function verifyOTP(phone, token) {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        if (error) throw error;
        return data;
    }

    // Sign out
    async function signOut() {
        await supabase.auth.signOut();
    }

    // Get current JWT for API calls
    async function getAccessToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    }

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            session,
            loading,
            sendOTP,
            verifyOTP,
            signOut,
            getAccessToken,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
