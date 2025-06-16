import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silent error handling - no console logging
    this.props.onError?.(error, errorInfo);
    
    // Log to crash reporting service in production
    if (!__DEV__) {
      // Analytics.logError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content style={styles.content}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={64} 
                color="#f44336" 
                style={styles.icon}
              />
              <Title style={styles.title}>Something went wrong</Title>
              <Paragraph style={styles.message}>
                Please try again or restart the app.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={this.handleRetry}
                style={styles.retryButton}
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  errorCard: {
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  retryButton: {
    marginTop: 8,
  },
});

export default ErrorBoundary;
