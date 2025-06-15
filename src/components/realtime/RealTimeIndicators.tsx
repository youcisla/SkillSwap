import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useAdvancedAnimation, useFadeAnimation } from '../../hooks/useAdvancedAnimation';

interface TypingIndicatorProps {
  visible: boolean;
  userName?: string;
  style?: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  visible,
  userName = 'Someone',
  style,
}) => {
  const theme = useTheme();
  const { opacity, fadeIn, fadeOut } = useFadeAnimation(0);
  const { animatedValue: dot1, animate: animateDot1 } = useAdvancedAnimation(0.3);
  const { animatedValue: dot2, animate: animateDot2 } = useAdvancedAnimation(0.3);
  const { animatedValue: dot3, animate: animateDot3 } = useAdvancedAnimation(0.3);

  React.useEffect(() => {
    if (visible) {
      fadeIn();
      startDotAnimation();
    } else {
      fadeOut();
    }
  }, [visible]);

  const startDotAnimation = () => {
    const animateDots = async () => {
      await Promise.all([
        animateDot1(1, { duration: 500 }),
        animateDot2(1, { duration: 500, delay: 150 }),
        animateDot3(1, { duration: 500, delay: 300 }),
      ]);
      
      await Promise.all([
        animateDot1(0.3, { duration: 500 }),
        animateDot2(0.3, { duration: 500, delay: 150 }),
        animateDot3(0.3, { duration: 500, delay: 300 }),
      ]);
      
      if (visible) {
        animateDots(); // Repeat
      }
    };
    
    animateDots();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }, style]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
          {userName} is typing
        </Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.primary, opacity: dot1 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.primary, opacity: dot2 },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: theme.colors.primary, opacity: dot3 },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

interface UserPresenceProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: number;
  showText?: boolean;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  isOnline,
  lastSeen,
  size = 12,
  showText = false,
}) => {
  const theme = useTheme();
  const { animatedValue, animate } = useAdvancedAnimation(0);

  React.useEffect(() => {
    if (isOnline) {
      // Pulse animation for online status
      const pulse = async () => {
        await animate(1, { duration: 1000 });
        await animate(0.6, { duration: 1000 });
        if (isOnline) pulse(); // Repeat if still online
      };
      pulse();
    } else {
      animate(1, { duration: 200 });
    }
  }, [isOnline]);

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (lastSeen) {
      const now = new Date();
      const diff = now.getTime() - lastSeen.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
    return 'Offline';
  };

  return (
    <View style={styles.presenceContainer}>
      <Animated.View
        style={[
          styles.presenceIndicator,
          {
            width: size,
            height: size,
            backgroundColor: isOnline ? '#4caf50' : theme.colors.outline,
            opacity: animatedValue,
          },
        ]}
      />
      {showText && (
        <Text style={[styles.presenceText, { color: theme.colors.onSurfaceVariant }]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  size?: number;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  size = 16,
}) => {
  const theme = useTheme();
  const { animatedValue, animate } = useAdvancedAnimation(0);

  React.useEffect(() => {
    animate(1, { duration: 300 });
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return 'clock-outline';
      case 'sent':
        return 'check';
      case 'delivered':
        return 'check-all';
      case 'read':
        return 'check-all';
      case 'failed':
        return 'alert-circle-outline';
      default:
        return 'check';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return theme.colors.outline;
      case 'sent':
        return theme.colors.outline;
      case 'delivered':
        return theme.colors.primary;
      case 'read':
        return '#4caf50';
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  return (
    <Animated.View style={{ opacity: animatedValue }}>
      <IconButton
        icon={getStatusIcon()}
        size={size}
        iconColor={getStatusColor()}
        style={styles.statusIcon}
      />
    </Animated.View>
  );
};

// Main component that combines all real-time indicators
interface RealTimeIndicatorsProps {
  showTypingIndicator?: boolean;
  typingUser?: string;
  showOnlineStatus?: boolean;
  showOfflineIndicator?: boolean;
  offlineMessage?: string;
  userPresence?: 'online' | 'away' | 'busy' | 'offline';
  messageStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  style?: any;
}

const RealTimeIndicators: React.FC<RealTimeIndicatorsProps> = ({
  showTypingIndicator = false,
  typingUser,
  showOnlineStatus = false,
  showOfflineIndicator = false,
  offlineMessage,
  userPresence = 'offline',
  messageStatus,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showTypingIndicator && (
        <TypingIndicator
          visible={true}
          userName={typingUser}
        />
      )}
      
      {showOnlineStatus && (
        <UserPresence
          isOnline={userPresence === 'online'}
          size={12}
        />
      )}
      
      {showOfflineIndicator && (
        <UserPresence
          isOnline={false}
          size={12}
          showText={true}
          lastSeen={new Date()} // Assuming last seen is now for offline indicator
        />
      )}
      
      {messageStatus && (
        <MessageStatus
          status={messageStatus}
          size={16}
        />
      )}
    </View>
  );
};

export default RealTimeIndicators;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  presenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presenceIndicator: {
    borderRadius: 999,
    marginRight: 4,
  },
  presenceText: {
    fontSize: 12,
  },
  statusIcon: {
    margin: 0,
    padding: 0,
  },
});
