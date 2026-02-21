import { Ionicons } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useI18n } from '@/shared/i18n';
import Colors from '@/shared/theme/colors';
import { HEADER_TOP_GAP_XL, Spacing, WEB_HEADER_OFFSET } from '@/shared/theme/spacing';
import { FontSize } from '@/shared/theme/typography';

const p = Colors.palette;

export default function LoginScreen() {
  const auth = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setError('');
    let url = serverUrl.trim();
    if (!url || !username.trim() || !password.trim()) return;

    url = url.replace(/\/+$/, '');

    setConnecting(true);
    const success = await auth.connect(url, username.trim(), password);
    setConnecting(false);

    if (!success) {
      setError(t('auth.connectionFailed'));
    }
  }, [serverUrl, username, password, auth, t]);

  if (!fontsLoaded) return null;

  if (auth.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={p.accent} />
      </View>
    );
  }

  if (auth.isConnected) {
    return <Redirect href="/(tabs)" />;
  }

  const topPadding = insets.top + (Platform.OS === 'web' ? WEB_HEADER_OFFSET : 0);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + HEADER_TOP_GAP_XL }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="radio-outline" size={40} color={p.accent} style={styles.icon} />
          <Text style={styles.title}>SonicWave</Text>
          <Text style={styles.subtitle}>Connect to your Subsonic server</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, focusedField === 'url' && styles.inputFocused]}
            placeholder="https://music.example.com"
            placeholderTextColor={p.textTertiary}
            value={serverUrl}
            onChangeText={setServerUrl}
            onFocus={() => setFocusedField('url')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="next"
            accessibilityLabel="Server URL"
          />

          <TextInput
            style={[styles.input, focusedField === 'username' && styles.inputFocused]}
            placeholder={t('auth.username')}
            placeholderTextColor={p.textTertiary}
            value={username}
            onChangeText={setUsername}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            accessibilityLabel={t('auth.username')}
          />

          <TextInput
            style={[styles.input, focusedField === 'password' && styles.inputFocused]}
            placeholder={t('auth.password')}
            placeholderTextColor={p.textTertiary}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
            accessibilityLabel={t('auth.password')}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              connecting && styles.buttonDisabled,
            ]}
            onPress={handleConnect}
            disabled={connecting}
            accessibilityLabel="Connect to server"
            accessibilityRole="button"
          >
            {connecting ? (
              <ActivityIndicator size="small" color={p.black} />
            ) : (
              <Text style={styles.buttonText}>{t('auth.connect')}</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: p.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: p.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['5xl'],
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize.display,
    color: p.accent,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.input,
    color: p.textSecondary,
  },
  form: {
    gap: Spacing.mlg,
  },
  input: {
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    color: p.textPrimary,
    fontSize: FontSize.subtitle,
    borderWidth: 1,
    borderColor: p.border,
    fontFamily: 'Inter_400Regular',
  },
  inputFocused: {
    borderColor: p.accent,
  },
  button: {
    backgroundColor: p.accent,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: FontSize.subtitle,
    color: p.black,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.body,
    color: p.danger,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
