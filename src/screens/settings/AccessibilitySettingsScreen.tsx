import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Card,
    Chip,
    Divider,
    IconButton,
    List,
    Switch,
    Text,
    Title,
} from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

interface AccessibilitySettingsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

interface AccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  voiceCommands: boolean;
  hapticFeedback: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
  colorBlindSupport: boolean;
  audioDescriptions: boolean;
}

const AccessibilitySettingsScreen: React.FC<AccessibilitySettingsProps> = ({
  onSettingsChange,
}) => {
  const { theme, isDark, toggleTheme } = useAppTheme();
  
  const [settings, setSettings] = useState<AccessibilitySettings>({
    screenReader: false,
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    voiceCommands: false,
    hapticFeedback: true,
    fontSize: 'medium',
    colorBlindSupport: false,
    audioDescriptions: false,
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const fontSizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'Extra Large', value: 'extraLarge' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Visual Accessibility</Title>
          
          <List.Item
            title="High Contrast Mode"
            description="Enhance text and UI element contrast"
            left={() => <IconButton icon="contrast" />}
            right={() => (
              <Switch
                value={settings.highContrast}
                onValueChange={(value) => updateSetting('highContrast', value)}
                accessibilityLabel="Toggle high contrast mode"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark themes"
            left={() => <IconButton icon={isDark ? 'weather-night' : 'weather-sunny'} />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                accessibilityLabel="Toggle dark mode"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Large Text"
            description="Increase text size throughout the app"
            left={() => <IconButton icon="format-size" />}
            right={() => (
              <Switch
                value={settings.largeText}
                onValueChange={(value) => updateSetting('largeText', value)}
                accessibilityLabel="Toggle large text"
              />
            )}
          />
          
          <Divider />
          
          <View style={styles.fontSizeSection}>
            <Text style={styles.settingLabel}>Font Size</Text>
            <View style={styles.chipContainer}>
              {fontSizeOptions.map((option) => (
                <Chip
                  key={option.value}
                  mode={settings.fontSize === option.value ? 'flat' : 'outlined'}
                  selected={settings.fontSize === option.value}
                  onPress={() => updateSetting('fontSize', option.value as any)}
                  style={styles.chip}
                  accessibilityLabel={`Set font size to ${option.label}`}
                >
                  <Text>{option.label}</Text>
                </Chip>
              ))}
            </View>
          </View>
          
          <Divider />
          
          <List.Item
            title="Color Blind Support"
            description="Adjust colors for better visibility"
            left={() => <IconButton icon="palette" />}
            right={() => (
              <Switch
                value={settings.colorBlindSupport}
                onValueChange={(value) => updateSetting('colorBlindSupport', value)}
                accessibilityLabel="Toggle color blind support"
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Motor Accessibility</Title>
          
          <List.Item
            title="Reduce Motion"
            description="Minimize animations and transitions"
            left={() => <IconButton icon="motion-pause" />}
            right={() => (
              <Switch
                value={settings.reduceMotion}
                onValueChange={(value) => updateSetting('reduceMotion', value)}
                accessibilityLabel="Toggle reduce motion"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Haptic Feedback"
            description="Vibration feedback for interactions"
            left={() => <IconButton icon="vibrate" />}
            right={() => (
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => updateSetting('hapticFeedback', value)}
                accessibilityLabel="Toggle haptic feedback"
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Audio Accessibility</Title>
          
          <List.Item
            title="Screen Reader Support"
            description="Enhanced support for screen readers"
            left={() => <IconButton icon="text-to-speech" />}
            right={() => (
              <Switch
                value={settings.screenReader}
                onValueChange={(value) => updateSetting('screenReader', value)}
                accessibilityLabel="Toggle screen reader support"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Voice Commands"
            description="Control app with voice commands"
            left={() => <IconButton icon="microphone" />}
            right={() => (
              <Switch
                value={settings.voiceCommands}
                onValueChange={(value) => updateSetting('voiceCommands', value)}
                accessibilityLabel="Toggle voice commands"
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Audio Descriptions"
            description="Spoken descriptions for visual content"
            left={() => <IconButton icon="volume-high" />}
            right={() => (
              <Switch
                value={settings.audioDescriptions}
                onValueChange={(value) => updateSetting('audioDescriptions', value)}
                accessibilityLabel="Toggle audio descriptions"
              />
            )}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fontSizeSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default AccessibilitySettingsScreen;
