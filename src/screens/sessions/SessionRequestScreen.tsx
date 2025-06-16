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
import { useAppDispatch, useAppSelector } from '../../store';
import { createSession } from '../../store/slices/sessionSlice';
import { RootStackParamList, SessionStatus } from '../../types';

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
  
  const { otherUserId, skillId, skillName, isTeaching } = route.params;
  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (date <= new Date()) {
      newErrors.date = 'Please select a future date and time';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        status: SessionStatus.PENDING,
        scheduledAt: date,
        location: location.trim(),
        notes: notes.trim(),
      };

      await dispatch(createSession(sessionData)).unwrap();
      
      Alert.alert(
        'Session Request Sent!',
        'Your session request has been sent. You will be notified when it is accepted.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Optionally navigate to calendar
              setTimeout(() => {
                (navigation as any).navigate('Calendar');
              }, 500);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create session:', error);
      Alert.alert('Error', 'Failed to send session request. Please try again.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
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
            
            {/* Date Selection */}
            <Text style={styles.label}>Date</Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              contentStyle={styles.dateButtonContent}
            >
              {date.toLocaleDateString()}
            </Button>
            {errors.date && <HelperText type="error">{errors.date}</HelperText>}

            {/* Time Selection */}
            <Text style={styles.label}>Time</Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.dateButton}
              contentStyle={styles.dateButtonContent}
            >
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>

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

        {/* Date Picker Modals */}
        {showDatePicker && (
          <Text style={styles.pickerPlaceholder}>
            Date picker component would go here
          </Text>
        )}

        {showTimePicker && (
          <Text style={styles.pickerPlaceholder}>
            Time picker component would go here
          </Text>
        )}
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
});

export default SessionRequestScreen;
