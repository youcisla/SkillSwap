import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Paragraph, Title } from 'react-native-paper';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn
} from 'react-native-reanimated';
import { analyticsService } from '../../services/analyticsService';
import { logger } from '../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'screen' | 'component';
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('EnhancedErrorBoundary caught an error', error, 'ErrorBoundary');
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to analytics service
    analyticsService.logError({
      name: error.name,
      message: error.message,
      stack: error.stack,
      level: this.props.level || 'component',
      context: this.props.context,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    });

    // Track error event
    analyticsService.trackEvent('error_boundary_triggered', {
      error_type: error.name,
      error_message: error.message,
      level: this.props.level || 'component',
      context: this.props.context,
      error_id: this.state.errorId
    });
  }

  handleRetry = () => {
    console.log('🔄 Retrying after error boundary...');
    
    analyticsService.trackEvent('error_boundary_retry', {
      error_id: this.state.errorId,
      context: this.props.context
    });

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    analyticsService.trackEvent('error_boundary_report', {
      error_id: errorId,
      context: this.props.context
    });

    // In a real app, this would open an email client or feedback form
    console.log('📧 Error report requested:', {
      errorId,
      error: error?.message,
      context: this.props.context
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const isAppLevel = this.props.level === 'app';

      return (
        <View style={[styles.container, isAppLevel && styles.fullScreen]}>
          <Animated.View entering={FadeInUp.delay(100)}>
            <Card style={styles.errorCard} elevation={4}>
              <Card.Content style={styles.content}>
                <Animated.View entering={ZoomIn.delay(200)}>
                  <MaterialCommunityIcons 
                    name={isAppLevel ? "alert-circle" : "triangle-outline"} 
                    size={isAppLevel ? 80 : 64} 
                    color="#f44336" 
                    style={styles.icon}
                  />
                </Animated.View>
                
                <Animated.View entering={FadeInDown.delay(300)}>
                  <Title style={[styles.title, isAppLevel && styles.appLevelTitle]}>
                    {isAppLevel ? 'App Crashed' : 'Something went wrong'}
                  </Title>
                  
                  <Paragraph style={styles.message}>
                    {isAppLevel 
                      ? 'The app encountered a critical error and needs to be restarted.'
                      : 'We\'re sorry, but something unexpected happened in this section.'
                    }
                  </Paragraph>

                  {this.props.context && (
                    <Chip 
                      style={styles.contextChip} 
                      textStyle={styles.contextText}
                      mode="outlined"
                    >
                      {this.props.context}
                    </Chip>
                  )}

                  {errorId && (
                    <Text style={styles.errorId}>
                      Error ID: {errorId}
                    </Text>
                  )}

                  {__DEV__ && error && (
                    <View style={styles.debugContainer}>
                      <Text style={styles.debugTitle}>Debug Info:</Text>
                      <Text style={styles.errorDetails}>
                        {error.name}: {error.message}
                      </Text>
                      {error.stack && (
                        <Text style={styles.stackTrace} numberOfLines={5}>
                          {error.stack}
                        </Text>
                      )}
                    </View>
                  )}
                </Animated.View>

                <Animated.View 
                  entering={FadeInUp.delay(400)}
                  style={styles.buttonContainer}
                >
                  <Button 
                    mode="contained" 
                    onPress={this.handleRetry}
                    style={[styles.button, styles.retryButton]}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    {isAppLevel ? 'Restart App' : 'Try Again'}
                  </Button>
                  
                  {!__DEV__ && (
                    <Button 
                      mode="outlined" 
                      onPress={this.handleReportError}
                      style={[styles.button, styles.reportButton]}
                      contentStyle={styles.buttonContent}
                      labelStyle={styles.reportButtonLabel}
                    >
                      Report Issue
                    </Button>
                  )}
                </Animated.View>
              </Card.Content>
            </Card>
          </Animated.View>
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
    backgroundColor: '#f8f9fa',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  errorCard: {
    maxWidth: screenWidth - 32,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    color: '#212529',
    fontSize: 20,
    fontWeight: '600',
  },
  appLevelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6c757d',
    fontSize: 16,
    lineHeight: 24,
  },
  contextChip: {
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  contextText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  errorId: {
    fontSize: 10,
    color: '#adb5bd',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 12,
    color: '#dc3545',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#007bff',
  },
  reportButton: {
    borderColor: '#6c757d',
  },
  reportButtonLabel: {
    color: '#495057',
    fontSize: 14,
  },
});

export default EnhancedErrorBoundary;
