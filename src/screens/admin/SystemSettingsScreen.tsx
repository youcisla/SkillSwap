import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    List,
    Switch,
    Text,
    TextInput,
    Title
} from 'react-native-paper';

interface SystemSettings {
  general: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerSession: number;
    sessionDurationLimit: number; // in minutes
  };
  security: {
    passwordMinLength: number;
    requireEmailVerification: boolean;
    enableTwoFactorAuth: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
  };
  features: {
    chatEnabled: boolean;
    videoCallEnabled: boolean;
    fileUploadEnabled: boolean;
    skillRecommendations: boolean;
    userMatching: boolean;
    geoLocation: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    sessionReminders: boolean;
    matchNotifications: boolean;
    messageNotifications: boolean;
  };
  content: {
    maxSkillsPerUser: number;
    autoModeration: boolean;
    profanityFilter: boolean;
    imageModeration: boolean;
    requireSkillApproval: boolean;
  };
  analytics: {
    dataRetentionDays: number;
    anonymizeUserData: boolean;
    trackUserBehavior: boolean;
    shareAnalytics: boolean;
  };
}

const SystemSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      appName: 'SkillShare',
      appVersion: '1.0.0',
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerSession: 10,
      sessionDurationLimit: 120,
    },
    security: {
      passwordMinLength: 8,
      requireEmailVerification: true,
      enableTwoFactorAuth: false,
      sessionTimeout: 1440,
      maxLoginAttempts: 5,
    },
    features: {
      chatEnabled: true,
      videoCallEnabled: true,
      fileUploadEnabled: true,
      skillRecommendations: true,
      userMatching: true,
      geoLocation: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
      matchNotifications: true,
      messageNotifications: true,
    },
    content: {
      maxSkillsPerUser: 20,
      autoModeration: true,
      profanityFilter: true,
      imageModeration: true,
      requireSkillApproval: false,
    },
    analytics: {
      dataRetentionDays: 365,
      anonymizeUserData: true,
      trackUserBehavior: true,
      shareAnalytics: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await adminService.getSettings();
      // setSettings(response);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // await adminService.updateSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              general: {
                appName: 'SkillShare',
                appVersion: '1.0.0',
                maintenanceMode: false,
                registrationEnabled: true,
                maxUsersPerSession: 10,
                sessionDurationLimit: 120,
              },
              security: {
                passwordMinLength: 8,
                requireEmailVerification: true,
                enableTwoFactorAuth: false,
                sessionTimeout: 1440,
                maxLoginAttempts: 5,
              },
              features: {
                chatEnabled: true,
                videoCallEnabled: true,
                fileUploadEnabled: true,
                skillRecommendations: true,
                userMatching: true,
                geoLocation: true,
              },
              notifications: {
                emailNotifications: true,
                pushNotifications: true,
                sessionReminders: true,
                matchNotifications: true,
                messageNotifications: true,
              },
              content: {
                maxSkillsPerUser: 20,
                autoModeration: true,
                profanityFilter: true,
                imageModeration: true,
                requireSkillApproval: false,
              },
              analytics: {
                dataRetentionDays: 365,
                anonymizeUserData: true,
                trackUserBehavior: true,
                shareAnalytics: false,
              },
            });
            setHasChanges(true);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>System Settings</Title>
            <Text style={styles.subtitle}>
              Configure global application settings and features
            </Text>
            {hasChanges && (
              <Chip icon="alert" style={styles.changesChip}>
                Unsaved changes
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* General Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>General Settings</Title>
            
            <TextInput
              label="App Name"
              value={settings.general.appName}
              onChangeText={(value) => updateSetting('general', 'appName', value)}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="App Version"
              value={settings.general.appVersion}
              onChangeText={(value) => updateSetting('general', 'appVersion', value)}
              mode="outlined"
              style={styles.input}
            />

            <List.Item
              title="Maintenance Mode"
              description="Disable app access for non-admin users"
              right={() => (
                <Switch
                  value={settings.general.maintenanceMode}
                  onValueChange={(value) => updateSetting('general', 'maintenanceMode', value)}
                />
              )}
            />

            <List.Item
              title="Registration Enabled"
              description="Allow new user registrations"
              right={() => (
                <Switch
                  value={settings.general.registrationEnabled}
                  onValueChange={(value) => updateSetting('general', 'registrationEnabled', value)}
                />
              )}
            />

            <TextInput
              label="Max Users Per Session"
              value={settings.general.maxUsersPerSession.toString()}
              onChangeText={(value) => updateSetting('general', 'maxUsersPerSession', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Session Duration Limit (minutes)"
              value={settings.general.sessionDurationLimit.toString()}
              onChangeText={(value) => updateSetting('general', 'sessionDurationLimit', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Security Settings</Title>
            
            <TextInput
              label="Password Minimum Length"
              value={settings.security.passwordMinLength.toString()}
              onChangeText={(value) => updateSetting('security', 'passwordMinLength', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <List.Item
              title="Require Email Verification"
              description="Users must verify email before accessing app"
              right={() => (
                <Switch
                  value={settings.security.requireEmailVerification}
                  onValueChange={(value) => updateSetting('security', 'requireEmailVerification', value)}
                />
              )}
            />

            <List.Item
              title="Enable Two-Factor Authentication"
              description="Optional 2FA for enhanced security"
              right={() => (
                <Switch
                  value={settings.security.enableTwoFactorAuth}
                  onValueChange={(value) => updateSetting('security', 'enableTwoFactorAuth', value)}
                />
              )}
            />

            <TextInput
              label="Session Timeout (minutes)"
              value={settings.security.sessionTimeout.toString()}
              onChangeText={(value) => updateSetting('security', 'sessionTimeout', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Max Login Attempts"
              value={settings.security.maxLoginAttempts.toString()}
              onChangeText={(value) => updateSetting('security', 'maxLoginAttempts', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Features Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Features</Title>
            
            <List.Item
              title="Chat Enabled"
              description="Enable messaging between users"
              right={() => (
                <Switch
                  value={settings.features.chatEnabled}
                  onValueChange={(value) => updateSetting('features', 'chatEnabled', value)}
                />
              )}
            />

            <List.Item
              title="Video Call Enabled"
              description="Enable video calls during sessions"
              right={() => (
                <Switch
                  value={settings.features.videoCallEnabled}
                  onValueChange={(value) => updateSetting('features', 'videoCallEnabled', value)}
                />
              )}
            />

            <List.Item
              title="File Upload Enabled"
              description="Allow users to upload files and images"
              right={() => (
                <Switch
                  value={settings.features.fileUploadEnabled}
                  onValueChange={(value) => updateSetting('features', 'fileUploadEnabled', value)}
                />
              )}
            />

            <List.Item
              title="Skill Recommendations"
              description="AI-powered skill suggestions"
              right={() => (
                <Switch
                  value={settings.features.skillRecommendations}
                  onValueChange={(value) => updateSetting('features', 'skillRecommendations', value)}
                />
              )}
            />

            <List.Item
              title="User Matching"
              description="Automatic matching of compatible users"
              right={() => (
                <Switch
                  value={settings.features.userMatching}
                  onValueChange={(value) => updateSetting('features', 'userMatching', value)}
                />
              )}
            />

            <List.Item
              title="Geo Location"
              description="Location-based features and matching"
              right={() => (
                <Switch
                  value={settings.features.geoLocation}
                  onValueChange={(value) => updateSetting('features', 'geoLocation', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Notifications Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Notifications</Title>
            
            <List.Item
              title="Email Notifications"
              description="Send email notifications to users"
              right={() => (
                <Switch
                  value={settings.notifications.emailNotifications}
                  onValueChange={(value) => updateSetting('notifications', 'emailNotifications', value)}
                />
              )}
            />

            <List.Item
              title="Push Notifications"
              description="Send push notifications to mobile apps"
              right={() => (
                <Switch
                  value={settings.notifications.pushNotifications}
                  onValueChange={(value) => updateSetting('notifications', 'pushNotifications', value)}
                />
              )}
            />

            <List.Item
              title="Session Reminders"
              description="Remind users about upcoming sessions"
              right={() => (
                <Switch
                  value={settings.notifications.sessionReminders}
                  onValueChange={(value) => updateSetting('notifications', 'sessionReminders', value)}
                />
              )}
            />

            <List.Item
              title="Match Notifications"
              description="Notify users about new matches"
              right={() => (
                <Switch
                  value={settings.notifications.matchNotifications}
                  onValueChange={(value) => updateSetting('notifications', 'matchNotifications', value)}
                />
              )}
            />

            <List.Item
              title="Message Notifications"
              description="Notify users about new messages"
              right={() => (
                <Switch
                  value={settings.notifications.messageNotifications}
                  onValueChange={(value) => updateSetting('notifications', 'messageNotifications', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Content Moderation Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Content Moderation</Title>
            
            <TextInput
              label="Max Skills Per User"
              value={settings.content.maxSkillsPerUser.toString()}
              onChangeText={(value) => updateSetting('content', 'maxSkillsPerUser', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <List.Item
              title="Auto Moderation"
              description="Automatically flag inappropriate content"
              right={() => (
                <Switch
                  value={settings.content.autoModeration}
                  onValueChange={(value) => updateSetting('content', 'autoModeration', value)}
                />
              )}
            />

            <List.Item
              title="Profanity Filter"
              description="Filter inappropriate language"
              right={() => (
                <Switch
                  value={settings.content.profanityFilter}
                  onValueChange={(value) => updateSetting('content', 'profanityFilter', value)}
                />
              )}
            />

            <List.Item
              title="Image Moderation"
              description="Automatically scan uploaded images"
              right={() => (
                <Switch
                  value={settings.content.imageModeration}
                  onValueChange={(value) => updateSetting('content', 'imageModeration', value)}
                />
              )}
            />

            <List.Item
              title="Require Skill Approval"
              description="Admin approval required for new skills"
              right={() => (
                <Switch
                  value={settings.content.requireSkillApproval}
                  onValueChange={(value) => updateSetting('content', 'requireSkillApproval', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Analytics Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Analytics & Privacy</Title>
            
            <TextInput
              label="Data Retention (days)"
              value={settings.analytics.dataRetentionDays.toString()}
              onChangeText={(value) => updateSetting('analytics', 'dataRetentionDays', parseInt(value) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <List.Item
              title="Anonymize User Data"
              description="Remove personal identifiers from analytics"
              right={() => (
                <Switch
                  value={settings.analytics.anonymizeUserData}
                  onValueChange={(value) => updateSetting('analytics', 'anonymizeUserData', value)}
                />
              )}
            />

            <List.Item
              title="Track User Behavior"
              description="Collect usage analytics for app improvement"
              right={() => (
                <Switch
                  value={settings.analytics.trackUserBehavior}
                  onValueChange={(value) => updateSetting('analytics', 'trackUserBehavior', value)}
                />
              )}
            />

            <List.Item
              title="Share Analytics"
              description="Share aggregated data with third parties"
              right={() => (
                <Switch
                  value={settings.analytics.shareAnalytics}
                  onValueChange={(value) => updateSetting('analytics', 'shareAnalytics', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={resetToDefaults}
                icon="restore"
                style={styles.actionButton}
              >
                Reset to Defaults
              </Button>
              <Button
                mode="contained"
                onPress={saveSettings}
                icon="content-save"
                loading={loading}
                disabled={!hasChanges}
                style={styles.actionButton}
              >
                Save Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
  },
  changesChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
  },
  input: {
    marginVertical: 8,
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default SystemSettingsScreen;
