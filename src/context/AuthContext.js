import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { restoreSession(); }, []);

  async function restoreSession() {
    try {
      const storedUser = await AsyncStorage.getItem('@eletrohub:user');
      const storedToken = await AsyncStorage.getItem('@eletrohub:token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await authAPI.signin(email, password);
    setUser(data.user);
    setToken(data.token);
    await AsyncStorage.setItem('@eletrohub:user', JSON.stringify(data.user));
    await AsyncStorage.setItem('@eletrohub:token', data.token);
    return data;
  }

  async function loginWithGoogle({ id, name, email, photo }) {
    const oauthUser = {
      id: `google_${id}`,
      name: name || email,
      email,
      photo: photo || null,
      provider: 'google',
    };
    const fakeToken = `google_token_${id}`;
    setUser(oauthUser);
    setToken(fakeToken);
    await AsyncStorage.setItem('@eletrohub:user', JSON.stringify(oauthUser));
    await AsyncStorage.setItem('@eletrohub:token', fakeToken);
  }

  async function loginWithApple(credential) {
    const fullName = credential.fullName;
    const name = fullName?.givenName
      ? `${fullName.givenName}${fullName.familyName ? ' ' + fullName.familyName : ''}`.trim()
      : 'Usuário Apple';
    const oauthUser = {
      id: `apple_${credential.user}`,
      name,
      email: credential.email || `${credential.user}@privaterelay.appleid.com`,
      photo: null,
      provider: 'apple',
    };
    const fakeToken = `apple_token_${credential.user}`;
    setUser(oauthUser);
    setToken(fakeToken);
    await AsyncStorage.setItem('@eletrohub:user', JSON.stringify(oauthUser));
    await AsyncStorage.setItem('@eletrohub:token', fakeToken);
  }

  async function register(name, email, password) {
    return authAPI.signup(name, email, password);
  }

  async function updateProfile(updates) {
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('@eletrohub:user', JSON.stringify(updated));
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(['@eletrohub:user', '@eletrohub:token', '@eletrohub:onboarding']);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, loginWithApple, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
