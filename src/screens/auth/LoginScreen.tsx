import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Paragraph,
    Snackbar,
    Text,
    TextInput,
    Title,
} from 'react-native-paper';
import { apiService } from '../../services/apiService';
import { useAppDispatch, useAppSelector } from '../../store';
import { login } from '../../store/slices/authSlice';
import { LoginForm, RootStackParamList } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ online: boolean; checking: boolean }>({
    online: true,
    checking: false
  });

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    setServerStatus(prev => ({ ...prev, checking: true }));
    try {
      const status = await apiService.checkServerHealth();
      setServerStatus({ online: status.online, checking: false });
      
      if (!status.online) {
        console.warn('⚠️ Server is offline:', status);
      }
    } catch (error) {
      setServerStatus({ online: false, checking: false });
      console.error('Failed to check server status:', error);
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setSnackbarVisible(true);
      return;
    }

    // Check server status before attempting login
    if (!serverStatus.online) {
      await checkServerStatus();
      if (!serverStatus.online) {
        setSnackbarVisible(true);
        return;
      }
    }

    try {
      await dispatch(login(form)).unwrap();
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Check if it's a server connection error
      if (error.message?.includes('Backend server is not running') ||
          error.message?.includes('Failed to fetch')) {
        await checkServerStatus();
      }
    }
  };

  const isFormValid = form.email.length > 0 && form.password.length > 0;

  const getErrorMessage = () => {
    if (!serverStatus.online) {
      return '🔌 Backend server is not running. Please start the server and try again.';
    }
    if (error?.includes('Backend server is not running')) {
      return error;
    }
    if (error) {
      return error;
    }
    if (!isFormValid && snackbarVisible) {
      return 'Please fill in all fields';
    }
    return '';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Welcome to SkillSwap</Title>
              <Paragraph style={styles.subtitle}>
                Sign in to start exchanging skills
              </Paragraph>

              {/* Server Status Indicator */}
              {!serverStatus.online && (
                <Card style={[styles.statusCard, styles.errorCard]}>
                  <Card.Content>
                    <Text style={styles.statusText}>
                      🔌 Server Offline
                    </Text>
                    <Text style={styles.statusSubtext}>
                      Backend server is not running. Please start the server:
                      {'\n'}1. Open terminal in backend folder
                      {'\n'}2. Run: npm start
                      {'\n'}3. Server should start on http://localhost:3000
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={checkServerStatus}
                      loading={serverStatus.checking}
                      style={styles.retryButton}
                    >
                      Check Again
                    </Button>
                  </Card.Content>
                </Card>
              )}

              <TextInput
                label="Email"
                value={form.email}
                onChangeText={(text) => handleInputChange('email', text)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <TextInput
                label="Password"
                value={form.password}
                onChangeText={(text) => handleInputChange('password', text)}
                mode="outlined"
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={!isFormValid || loading || !serverStatus.online}
                style={styles.button}
              >
                Sign In
              </Button>

              <View style={styles.footer}>
                <Text>Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Register')}
                  compact
                >
                  Sign Up
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible || !!error || !serverStatus.online}
        onDismiss={() => setSnackbarVisible(false)}
        duration={error?.includes('Backend server is not running') ? 10000 : 3000}
        action={
          !serverStatus.online ? {
            label: 'Retry',
            onPress: checkServerStatus,
          } : undefined
        }
      >
        <Text>{getErrorMessage()}</Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  statusCard: {
    marginBottom: 16,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#6200ea',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
