import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SubsonicClient } from '@/lib/api/subsonic';
import type { ServerConfig } from '@/lib/api/types';

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
          SecureStore.getItemAsync(STORE_KEYS.url),
          SecureStore.getItemAsync(STORE_KEYS.username),
          SecureStore.getItemAsync(STORE_KEYS.password),
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
      const config: ServerConfig = { url, username, password };
      const newClient = new SubsonicClient(config);
      const ok = await newClient.ping();

      if (!ok) {
        setIsLoading(false);
        return false;
      }

      await Promise.all([
        SecureStore.setItemAsync(STORE_KEYS.url, url),
        SecureStore.setItemAsync(STORE_KEYS.username, username),
        SecureStore.setItemAsync(STORE_KEYS.password, password),
      ]);

      clientRef.current = newClient;
      setServerConfig(config);
      setIsConnected(true);
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORE_KEYS.url),
      SecureStore.deleteItemAsync(STORE_KEYS.username),
      SecureStore.deleteItemAsync(STORE_KEYS.password),
    ]);
    clientRef.current = null;
    setServerConfig(null);
    setIsConnected(false);
  }, []);

  const value = useMemo(() => ({
    serverConfig,
    isConnected,
    isLoading,
    client: clientRef.current,
    connect,
    disconnect,
  }), [serverConfig, isConnected, isLoading, connect, disconnect]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
