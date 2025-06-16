import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    FAB,
    Text,
    Title
} from 'react-native-paper';
import CustomDateTimePicker from '../components/DateTimePicker';
import FallbackCalendar from '../components/FallbackCalendar';
import SafeAvatar from '../components/SafeAvatar';
import { useAppDispatch, useAppSelector } from '../store';
import { cancelSession, fetchSessions, updateSessionStatus } from '../store/slices/sessionSlice';
import { CalendarStackParamList, Session, SessionStatus } from '../types';
import { safeGetProfileImage, safeRenderSkill, safeRenderUserName } from '../utils/safeRender';

// Try to import react-native-calendars, fallback to our custom component
let Calendar: any = FallbackCalendar;
let hasCalendarLibrary = false;

// Always use FallbackCalendar for now to avoid TypeScript issues
// TODO: Re-enable react-native-calendars when types are properly available
console.log('📅 Using FallbackCalendar for TypeScript compatibility');
hasCalendarLibrary = false;

/*
// Commented out until react-native-calendars types are available
try {
  const calendarModule = require('react-native-calendars');
  if (calendarModule && calendarModule.Calendar) {
    Calendar = calendarModule.Calendar;
    hasCalendarLibrary = true;
    console.log('✅ react-native-calendars loaded successfully');
  }
} catch (error) {
  console.log('⚠️ react-native-calendars not available, using fallback calendar');
  hasCalendarLibrary = false;
}
*/

// Define the DateData interface for compatibility
interface DateData {
  dateString: string;
  day?: number;
  month?: number;
  year?: number;
  timestamp?: number;
}

type CalendarScreenNavigationProp = StackNavigationProp<CalendarStackParamList, 'CalendarMain'>;

interface Props {
  navigation: CalendarScreenNavigationProp;
}

const EnhancedCalendarScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { users } = useAppSelector((state) => state.user);

  const [selectedDate, setSelectedDate] = useState('');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  useEffect(() => {
    // Mark dates with sessions
    const marked: any = {};
    sessions.forEach(session => {
      const date = new Date(session.scheduledAt).toISOString().split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: getStatusColor(session.status),
        activeOpacity: 0.7
      };
    });
    setMarkedDates(marked);
  }, [sessions]);

  const loadSessions = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchSessions(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    }
  };

  const getOtherParticipant = (session: Session) => {
    const otherUserId = session.teacherId === user?.id ? session.studentId : session.teacherId;
    return users.find(u => u.id === otherUserId);
  };

  const getStatusColor = (status: SessionStatus) => {
    const colors = {
      [SessionStatus.PENDING]: '#ff9800',
      [SessionStatus.CONFIRMED]: '#4caf50',
      [SessionStatus.COMPLETED]: '#2196f3',
      [SessionStatus.CANCELLED]: '#f44336',
    };
    return colors[status] || '#666';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionsForDate = (date: string) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledAt).toISOString().split('T')[0];
      return sessionDate === date;
    });
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleCreateSession = () => {
    setShowDateTimePicker(true);
  };

  const handleDateTimeConfirm = (selectedDateTime: Date) => {
    // Navigate to session creation with selected date/time
    navigation.navigate('SessionRequest', {
      otherUserId: '', // This should be selected from matches/users
      skillId: '',
      skillName: '',
      isTeaching: true,
      scheduledAt: selectedDateTime.toISOString()
    } as any);
  };

  const handleSessionAction = async (sessionId: string, action: 'confirm' | 'cancel') => {
    try {
      if (action === 'confirm') {
        await dispatch(updateSessionStatus({
          sessionId,
          status: SessionStatus.CONFIRMED
        })).unwrap();
      } else {
        await dispatch(cancelSession({
          sessionId,
          reason: 'User cancelled'
        })).unwrap();
      }
      Alert.alert('Success', `Session ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully`);
    } catch (error) {
      console.error(`Failed to ${action} session:`, error);
      Alert.alert('Error', `Failed to ${action} session`);
    }
  };

  const renderSessionCard = (session: Session) => {
    const otherParticipant = getOtherParticipant(session);
    const isTeacher = session.teacherId === user?.id;
    
    return (
      <Card key={session.id} style={styles.sessionCard}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTime}>{formatTime(session.scheduledAt)}</Text>
              <Text style={styles.sessionType}>
                {isTeacher ? 'Teaching' : 'Learning'} Session
              </Text>
            </View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(session.status) }]}
              textStyle={styles.statusText}
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Chip>
          </View>

          <View style={styles.participantInfo}>
            <SafeAvatar 
              size={32} 
              source={safeGetProfileImage(otherParticipant)}
              fallbackText={safeRenderUserName(otherParticipant)?.charAt(0) || 'U'}
            />
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>
                {safeRenderUserName(otherParticipant)}
              </Text>
              <Text style={styles.skillName}>
                {safeRenderSkill(session.skillId)}
              </Text>
            </View>
          </View>

          {session.location && (
            <Text style={styles.location}>📍 {session.location}</Text>
          )}

          <View style={styles.sessionActions}>
            <Button 
              mode="outlined" 
              compact
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
            >
              View Details
            </Button>
            {session.status === SessionStatus.PENDING && (
              <>
                <Button 
                  mode="contained" 
                  compact
                  style={styles.confirmButton}
                  onPress={() => handleSessionAction(session.id, 'confirm')}
                >
                  Confirm
                </Button>
                <Button 
                  mode="outlined" 
                  compact
                  style={styles.cancelButton}
                  onPress={() => handleSessionAction(session.id, 'cancel')}
                >
                  Cancel
                </Button>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Calendar */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            <Title style={styles.title}>Schedule</Title>
            <Calendar
              current={new Date().toISOString().split('T')[0]}
              onDayPress={handleDateSelect}
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...markedDates[selectedDate],
                  selected: true,
                  selectedColor: '#6200ea'
                }
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#6200ea',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#6200ea',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#6200ea',
                selectedDotColor: '#ffffff',
                arrowColor: '#6200ea',
                monthTextColor: '#6200ea',
                indicatorColor: '#6200ea',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13
              }}
            />
          </Card.Content>
        </Card>

        {/* Selected Date Sessions */}
        {selectedDate && (
          <Card style={styles.sessionsCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>
                Sessions for {new Date(selectedDate).toLocaleDateString()}
              </Title>
              {selectedDateSessions.length > 0 ? (
                selectedDateSessions.map((session) => (
                  <View key={session.id}>
                    {renderSessionCard(session)}
                  </View>
                ))
              ) : (
                <Text style={styles.noSessionsText}>
                  No sessions scheduled for this date
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* All Upcoming Sessions */}
        <Card style={styles.sessionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Upcoming Sessions</Title>
            {sessions
              .filter(session => new Date(session.scheduledAt) > new Date())
              .slice(0, 5)
              .map((session) => (
                <View key={session.id}>
                  {renderSessionCard(session)}
                </View>
              ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Custom DateTime Picker */}
      <CustomDateTimePicker
        visible={showDateTimePicker}
        onDismiss={() => setShowDateTimePicker(false)}
        onConfirm={handleDateTimeConfirm}
        minimumDate={new Date()}
        title="Schedule New Session"
      />

      {/* FAB for creating new session */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateSession}
        label="Schedule Session"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    color: '#6200ea',
    marginBottom: 16,
  },
  calendarCard: {
    margin: 16,
    elevation: 4,
  },
  sessionsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  sectionTitle: {
    color: '#6200ea',
    marginBottom: 16,
  },
  sessionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionType: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillName: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    borderColor: '#f44336',
  },
  noSessionsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
  },
});

export default EnhancedCalendarScreen;
