import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { SubsonicClient } from '@/lib/api/subsonic';
import type { ServerConfig } from '@/lib/api/types';

async function secureSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

interface AuthContextValue {
  serverConfig: ServerConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  client: SubsonicClient | null;
  connect: (url: string, username: string, password: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORE_KEYS = {
  url: 'sonicwave_server_url',
  username: 'sonicwave_username',
  password: 'sonicwave_password',
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<SubsonicClient | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [url, username, password] = await Promise.all([
          secureGet(STORE_KEYS.url),
          secureGet(STORE_KEYS.username),
          secureGet(STORE_KEYS.password),
        ]);

        if (url && username && password) {
          const config: ServerConfig = { url, username, password };
          const newClient = new SubsonicClient(config);
          const ok = await newClient.ping();
          if (ok) {
            clientRef.current = newClient;
            setServerConfig(config);
            setIsConnected(true);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const connect = useCallback(async (url: string, username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const inputUrl = url.trim().replace(/\/+$/, '');
      const candidateUrls = /^https:\/\//i.test(inputUrl)
        ? [inputUrl, inputUrl.replace(/^https:\/\//i, 'http://')]
        : /^http:\/\//i.test(inputUrl)
          ? [inputUrl]
          : [`https://${inputUrl}`, `http://${inputUrl}`];

      let selectedClient: SubsonicClient | null = null;
      let selectedConfig: ServerConfig | null = null;

      for (const candidate of candidateUrls) {
        const config: ServerConfig = { url: candidate, username, password };
        const testClient = new SubsonicClient(config);
        const ok = await testClient.ping();
        if (ok) {
          selectedClient = testClient;
          selectedConfig = config;
          break;
        }
      }

      if (!selectedClient || !selectedConfig) {
        setIsLoading(false);
        return false;
      }

      try {
        await Promise.all([
          secureSet(STORE_KEYS.url, selectedConfig.url),
          secureSet(STORE_KEYS.username, username),
          secureSet(STORE_KEYS.password, password),
        ]);
      } catch (storeErr: any) {
        console.warn('AuthContext: SecureStore save failed (non-fatal):', storeErr?.message);
      }

      clientRef.current = selectedClient;
      setServerConfig(selectedConfig);
      setIsConnected(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('AuthContext: connect error:', err?.message);
      setIsLoading(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await Promise.all([
      secureDelete(STORE_KEYS.url),
      secureDelete(STORE_KEYS.username),
      secureDelete(STORE_KEYS.password),
    ]);
    clientRef.current = null;
    setServerConfig(null);
    setIsConnected(false);
  }, []);

  const value = useMemo(
    () => ({
      serverConfig,
      isConnected,
      isLoading,
      client: clientRef.current,
      connect,
      disconnect,
    }),
    [serverConfig, isConnected, isLoading, connect, disconnect],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
