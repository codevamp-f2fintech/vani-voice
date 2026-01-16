import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { api, ApiError } from '../lib/api';

// User type
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
    preferredLanguage: string;
    subscription: {
        tier: 'free' | 'starter' | 'pro' | 'enterprise';
        expiresAt: string | null;
    };
    wallet: {
        balance: number;
        currency: string;
    };
    settings: {
        notifications: {
            lowCreditAlert: boolean;
            callFailures: boolean;
            newTemplates: boolean;
        };
        twoFactorEnabled: boolean;
    };
    lastLoginAt: string | null;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, name: string, phone?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'preferredLanguage' | 'settings'>>) => Promise<boolean>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token management
const TOKEN_KEY = 'vani_access_token';
const REFRESH_TOKEN_KEY = 'vani_refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    });

    // Check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = getAccessToken();
            if (!token) {
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                const response = await api.get<{ success: boolean; user: User }>('/auth/me');
                if (response.success && response.user) {
                    setState({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });
                }
            } catch (error) {
                clearTokens();
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null
                });
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await api.post<{
                success: boolean;
                user: User;
                accessToken: string;
                refreshToken: string;
                message?: string;
            }>('/auth/login', { email, password });

            if (response.success) {
                setAccessToken(response.accessToken);
                setRefreshToken(response.refreshToken);
                setState({
                    user: response.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });
                return true;
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: response.message || 'Login failed'
            }));
            return false;
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Login failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: message
            }));
            return false;
        }
    }, []);

    const register = useCallback(async (
        email: string,
        password: string,
        name: string,
        phone?: string
    ): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await api.post<{
                success: boolean;
                user: User;
                accessToken: string;
                refreshToken: string;
                message?: string;
            }>('/auth/register', { email, password, name, phone });

            if (response.success) {
                setAccessToken(response.accessToken);
                setRefreshToken(response.refreshToken);
                setState({
                    user: response.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });
                return true;
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: response.message || 'Registration failed'
            }));
            return false;
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Registration failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: message
            }));
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout', {});
        } catch (error) {
            // Ignore logout errors, just clear local state
        } finally {
            clearTokens();
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get<{ success: boolean; user: User }>('/auth/me');
            if (response.success && response.user) {
                setState(prev => ({
                    ...prev,
                    user: response.user
                }));
            }
        } catch (error) {
            // Silently fail refresh
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'preferredLanguage' | 'settings'>>): Promise<boolean> => {
        try {
            const response = await api.patch<{ success: boolean; user: User }>('/auth/me', updates);
            if (response.success && response.user) {
                setState(prev => ({
                    ...prev,
                    user: response.user
                }));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const contextValue: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        clearError
    };

    return React.createElement(
        AuthContext.Provider,
        { value: contextValue },
        children
    );
}

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Protected Route Component
export function RequireAuth({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return React.createElement('div', {
            className: 'min-h-screen flex items-center justify-center bg-vani-light dark:bg-vani-dark'
        }, React.createElement('div', {
            className: 'animate-spin w-8 h-8 border-4 border-vani-plum border-t-transparent rounded-full'
        }));
    }

    if (!isAuthenticated) {
        // Will be redirected by App.tsx
        return null;
    }

    return React.createElement(React.Fragment, null, children);
}
