import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('📱 Notifications already initialized');
      return;
    }

    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (token) {
        console.log('📱 Push notification token:', token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      throw error;
    }
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📨 Notification received in foreground:', notification);
    });

    // Handle notification tapped/clicked
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'new-message' && data?.chatId) {
        // Navigate to chat screen
        // This would need to be implemented with proper navigation
        console.log('🔄 Should navigate to chat:', data.chatId);
      } else if (data?.type === 'new-match' && data?.matchId) {
        // Navigate to matches screen
        console.log('🔄 Should navigate to match:', data.matchId);
      } else if (data?.type === 'new-follower' && data?.userId) {
        // Navigate to followers screen
        console.log('🔄 Should navigate to follower:', data.userId);
      }
    });
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Register for push notifications error:', error);
      return null;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null,
      });
      return notificationId;
    } catch (error) {
      console.error('Schedule local notification error:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
      throw error;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Get badge count error:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Set badge count error:', error);
    }
  }

  async scheduleSessionReminder(
    sessionId: string,
    sessionDate: Date,
    participantName: string,
    skillName: string
  ): Promise<string> {
    try {
      // Schedule notification 1 hour before the session
      const reminderDate = new Date(sessionDate.getTime() - 60 * 60 * 1000);

      if (reminderDate <= new Date()) {
        // If the reminder time has already passed, don't schedule
        throw new Error('Session reminder time has already passed');
      }

      const notificationId = await this.scheduleLocalNotification(
        'Session Reminder',
        `Your session with ${participantName} for ${skillName} starts in 1 hour!`,
        { sessionId, type: 'session-reminder' },
        { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate 
        }
      );

      return notificationId;
    } catch (error) {
      console.error('Schedule session reminder error:', error);
      throw error;
    }
  }

  async scheduleNewMessageNotification(
    senderName: string,
    messagePreview: string,
    chatId: string
  ): Promise<string> {
    try {
      const notificationId = await this.scheduleLocalNotification(
        `New message from ${senderName}`,
        messagePreview,
        { chatId, type: 'new-message' }
      );

      return notificationId;
    } catch (error) {
      console.error('Schedule new message notification error:', error);
      throw error;
    }
  }

  async scheduleMatchNotification(
    matchedUserName: string,
    skillName: string,
    matchId: string
  ): Promise<string> {
    try {
      const notificationId = await this.scheduleLocalNotification(
        'New Match Found!',
        `You matched with ${matchedUserName} for ${skillName}`,
        { matchId, type: 'new-match' }
      );

      return notificationId;
    } catch (error) {
      console.error('Schedule match notification error:', error);
      throw error;
    }
  }

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
