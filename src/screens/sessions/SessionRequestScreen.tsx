import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  HelperText,
  Text,
  TextInput,
  Title,
  useTheme,
} from 'react-native-paper';
import CustomDateTimePicker from '../../components/DateTimePicker';
import { SessionValidationService } from '../../services/sessionValidationService';
import { useAppDispatch, useAppSelector } from '../../store';
import { createSession } from '../../store/slices/sessionSlice';
import { RootStackParamList } from '../../types';

type SessionRequestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SessionRequest'>;
type SessionRequestScreenRouteProp = RouteProp<RootStackParamList, 'SessionRequest'>;

interface Props {
  navigation: SessionRequestScreenNavigationProp;
  route: SessionRequestScreenRouteProp;
}

const SessionRequestScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.sessions);
  
  const { otherUserId, skillId, skillName, isTeaching, scheduledAt } = route.params;
  
  // Use the scheduled date from calendar if provided, otherwise default to tomorrow at 10 AM
  const getInitialDate = () => {
    if (scheduledAt) {
      return new Date(scheduledAt);
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(10, 0, 0, 0);
    return defaultDate;
  };
  
  const [date, setDate] = useState(getInitialDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validationWarnings, setValidationWarnings] = useState<{ [key: string]: string }>({});

  // Enhanced validation pipeline
  interface ValidationResult {
    isValid: boolean;
    errors: { [key: string]: string };
    warnings?: { [key: string]: string };
  }

  const validateSessionData = (sessionData: any): ValidationResult => {
    const errors: { [key: string]: string } = {};
    const warnings: { [key: string]: string } = {};

    // Date validation - must be in the future and during reasonable hours
    const now = new Date();
    const sessionDate = new Date(sessionData.scheduledAt);
    
    if (sessionDate <= now) {
      errors.date = 'Session must be scheduled for a future date and time';
    } else if (sessionDate < new Date(now.getTime() + 30 * 60 * 1000)) {
      warnings.date = 'Sessions scheduled within 30 minutes may be difficult to prepare for';
    }

    // Check if session is during reasonable hours (8 AM - 10 PM)
    const hour = sessionDate.getHours();
    if (hour < 8 || hour > 22) {
      warnings.time = 'Sessions outside of 8 AM - 10 PM may be inconvenient';
    }

    // Location validation
    if (!sessionData.location?.trim()) {
      errors.location = 'Location is required';
    } else if (sessionData.location.trim().length < 3) {
      errors.location = 'Please provide a more detailed location';
    }

    // Teacher/student validation
    if (!sessionData.teacherId || !sessionData.studentId) {
      errors.participants = 'Invalid session participants';
    }

    if (sessionData.teacherId === sessionData.studentId) {
      errors.participants = 'Teacher and student cannot be the same person';
    }

    // Skill validation
    if (!sessionData.skillId) {
      errors.skill = 'Skill is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  };

  const validateForm = () => {
    const sessionData = {
      teacherId: isTeaching ? user!.id : otherUserId,
      studentId: isTeaching ? otherUserId : user!.id,
      skillId,
      scheduledAt: date,
      location: location.trim(),
      notes: notes.trim(),
    };

    const validationResult = SessionValidationService.validateSessionData(sessionData);
    setErrors(validationResult.errors);
    setValidationWarnings(validationResult.warnings || {});
    
    return validationResult.isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const sessionData = {
        teacherId: isTeaching ? user!.id : otherUserId,
        studentId: isTeaching ? otherUserId : user!.id,
        skillId,
        scheduledAt: date,
        location: location.trim(),
        notes: notes.trim(),
      };

      const result = await dispatch(createSession(sessionData)).unwrap();
      
      Alert.alert(
        'Session Request Sent!',
        'Your session request has been sent. You will be notified when it is accepted.',
        [
          {
            text: 'View Calendar',
            onPress: () => {
              navigation.goBack();
              // Navigate to calendar with proper promise handling instead of setTimeout
              Promise.resolve().then(() => {
                navigation.getParent()?.navigate('Calendar');
              });
            },
          },
          {
            text: 'OK',
            style: 'default',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create session:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to send session request. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.message.includes('required')) {
          errorMessage = 'Please check your session details and try again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
          errorMessage = 'You are not authorized to create this session.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'User or skill not found. Please try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDateTimeConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setErrors(prev => ({ ...prev, date: '' })); // Clear date error
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Request Session</Title>
            <Text style={styles.subtitle}>
              {isTeaching 
                ? `Request to teach "${skillName}" to this user`
                : `Request to learn "${skillName}" from this user`
              }
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Session Details</Title>
            
            {/* Date and Time Picker */}
            <Text style={styles.label}>Scheduled Date & Time</Text>
            <Button
              mode="outlined"
              onPress={handleDatePress}
              style={styles.dateButton}
              contentStyle={styles.dateButtonContent}
              icon="calendar"
            >
              {formatDateTime(date)}
            </Button>
            {errors.date && <HelperText type="error">{errors.date}</HelperText>}
            <HelperText type="info">Tap to change the date and time</HelperText>

            <Divider style={styles.divider} />

            {/* Location */}
            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Coffee shop, Library, Online"
              error={!!errors.location}
            />
            {errors.location && <HelperText type="error">{errors.location}</HelperText>}

            {/* Notes */}
            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textArea}
              placeholder="Add any specific requirements or topics you'd like to cover..."
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Session Info</Title>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Your Role:</Text>
              <Text style={styles.infoValue}>{isTeaching ? 'Teacher' : 'Student'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Skill:</Text>
              <Text style={styles.infoValue}>{skillName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>60 minutes (typical)</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.actionButton}
            loading={loading}
            disabled={loading}
          >
            Send Request
          </Button>
        </View>

        {/* Custom DateTime Picker */}
        <CustomDateTimePicker
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          onConfirm={handleDateTimeConfirm}
          minimumDate={new Date()}
          title="Select Session Date & Time"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  dateButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  dateButtonContent: {
    paddingHorizontal: 8,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  pickerPlaceholder: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
  },
  dateDisplay: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});

export default SessionRequestScreen;
