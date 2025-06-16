import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  FAB,
  IconButton,
  Paragraph,
  Text,
  TextInput,
  Title
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../components/ui/MultiSelection';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useAppDispatch, useAppSelector } from '../store';
import { cancelSession, fetchSessions, updateSessionStatus } from '../store/slices/sessionSlice';
import { CalendarStackParamList, Session, SessionStatus, Skill, User } from '../types';

type CalendarScreenNavigationProp = StackNavigationProp<CalendarStackParamList, 'CalendarMain'>;

interface Props {
  navigation: CalendarScreenNavigationProp;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasSession: boolean;
  sessions: Session[];
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  conflictingUsers: string[];
}

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { users } = useAppSelector((state) => state.user);

  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'upcoming' | 'past' | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'list' | 'calendar'>('list');
  
  // Session creation modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);

  // Multi-selection hooks for different session types
  const upcomingSelection = useMultiSelection<Session>(
    (session) => session.id,
    { allowSelectAll: true }
  );

  const pastSelection = useMultiSelection<Session>(
    (session) => session.id,
    { allowSelectAll: true }
  );

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchSessions(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const getOtherParticipant = (session: Session) => {
    const otherUserId = session.teacherId === user?.id ? session.studentId : session.teacherId;
    return users.find(u => u.id === otherUserId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.PENDING:
        return '#ff9800';
      case SessionStatus.CONFIRMED:
        return '#4caf50';
      case SessionStatus.COMPLETED:
        return '#2196f3';
      case SessionStatus.CANCELLED:
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: SessionStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isUpcoming = (session: Session) => {
    return new Date(session.scheduledAt) > new Date() && 
           (session.status === SessionStatus.PENDING || session.status === SessionStatus.CONFIRMED);
  };

  const isPast = (session: Session) => {
    return new Date(session.scheduledAt) < new Date() || 
           session.status === SessionStatus.COMPLETED || 
           session.status === SessionStatus.CANCELLED;
  };

  const upcomingSessions = sessions.filter(isUpcoming);
  const pastSessions = sessions.filter(isPast);

  // Calendar utility functions
  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayString = currentDate.toISOString().split('T')[0];
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt).toISOString().split('T')[0];
        return sessionDate === dayString;
      });

      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        hasSession: daySessions.length > 0,
        sessions: daySessions,
      });
    }

    return days;
  };

  const getTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const selectedDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Generate time slots from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(date);
        slotDateTime.setHours(hour, minute, 0, 0);
        
        // Check if this time slot conflicts with existing sessions
        const conflictingSessions = sessions.filter(session => {
          const sessionTime = new Date(session.scheduledAt);
          const sessionHour = sessionTime.getHours();
          const sessionMinute = sessionTime.getMinutes();
          const sessionDate = sessionTime.toDateString();
          
          return sessionDate === date.toDateString() && 
                 sessionHour === hour && 
                 Math.abs(sessionMinute - minute) < 30;
        });

        // Get users who are busy at this time
        const conflictingUsers = conflictingSessions.map(session => {
          const otherUserId = session.teacherId === user?.id ? session.studentId : session.teacherId;
          const otherUser = users.find(u => u.id === otherUserId);
          return otherUser?.name || 'Unknown User';
        });

        slots.push({
          time: timeString,
          isAvailable: conflictingSessions.length === 0,
          conflictingUsers,
        });
      }
    }

    return slots;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0)); // Default to 9 AM
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      handleDateSelect(selectedDate);
    }
  };

  const createSessionAtDateTime = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select both date and time');
      return;
    }

    const sessionDateTime = new Date(selectedDate);
    sessionDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    
    // Check for conflicts
    const timeSlots = getTimeSlots(selectedDate);
    const selectedTimeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
    const conflictingSlot = timeSlots.find(slot => slot.time === selectedTimeString);
    
    if (conflictingSlot && !conflictingSlot.isAvailable) {
      Alert.alert(
        'Time Conflict',
        `This time slot conflicts with existing sessions involving: ${conflictingSlot.conflictingUsers.join(', ')}. Do you want to proceed anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => setShowSessionModal(true) }
        ]
      );
    } else {
      setShowSessionModal(true);
    }
  };

  const handleBulkCancel = async () => {
    const selection = activeSection === 'upcoming' ? upcomingSelection : pastSelection;
    const targetSessions = activeSection === 'upcoming' ? upcomingSessions : pastSessions;
    const selectedSessions = targetSessions.filter(session => selection.isSelected(session));
    
    if (selectedSessions.length === 0) return;

    Alert.alert(
      'Cancel Sessions',
      `Are you sure you want to cancel ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedSessions.map(session => 
                  dispatch(cancelSession({ 
                    sessionId: session.id, 
                    reason: 'Bulk cancellation' 
                  })).unwrap()
                )
              );
              selection.deselectAll();
              setIsSelectionMode(false);
              setActiveSection(null);
            } catch (error) {
              console.error('Failed to cancel sessions:', error);
              Alert.alert('Error', 'Failed to cancel some sessions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBulkConfirm = async () => {
    const selection = activeSection === 'upcoming' ? upcomingSelection : pastSelection;
    const targetSessions = activeSection === 'upcoming' ? upcomingSessions : pastSessions;
    const selectedSessions = targetSessions.filter(session => 
      selection.isSelected(session) && session.status === SessionStatus.PENDING
    );
    
    if (selectedSessions.length === 0) return;

    Alert.alert(
      'Confirm Sessions',
      `Confirm ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Confirm All',
          onPress: async () => {
            try {
              await Promise.all(
                selectedSessions.map(session => 
                  dispatch(updateSessionStatus({ 
                    sessionId: session.id, 
                    status: SessionStatus.CONFIRMED 
                  })).unwrap()
                )
              );
              selection.deselectAll();
              setIsSelectionMode(false);
              setActiveSection(null);
              // Refresh sessions to reflect changes
              await loadSessions();
            } catch (error) {
              console.error('Failed to confirm sessions:', error);
              Alert.alert('Error', 'Failed to confirm some sessions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStartSelection = (section: 'upcoming' | 'past') => {
    setIsSelectionMode(true);
    setActiveSection(section);
  };

  const handleCancelSelection = () => {
    upcomingSelection.deselectAll();
    pastSelection.deselectAll();
    setIsSelectionMode(false);
    setActiveSection(null);
  };

  const getCurrentSelection = () => {
    if (activeSection === 'upcoming') return upcomingSelection;
    if (activeSection === 'past') return pastSelection;
    return null;
  };

  const getCurrentSessions = () => {
    if (activeSection === 'upcoming') return upcomingSessions;
    if (activeSection === 'past') return pastSessions;
    return [];
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={() => navigateMonth('prev')}>
        <IconButton icon="chevron-left" size={24} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Title style={styles.monthTitle}>{formatMonthYear(currentDate)}</Title>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateMonth('next')}>
        <IconButton icon="chevron-right" size={24} />
      </TouchableOpacity>
    </View>
  );

  const renderCalendarGrid = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Card style={styles.calendarCard}>
        <Card.Content>
          {/* Week day headers */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar days grid */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  day.isToday && styles.todayCell,
                  !day.isCurrentMonth && styles.otherMonthCell,
                  selectedDate?.toDateString() === day.date.toDateString() && styles.selectedDayCell,
                ]}
                onPress={() => handleDateSelect(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.dayText,
                  day.isToday && styles.todayText,
                  !day.isCurrentMonth && styles.otherMonthText,
                  selectedDate?.toDateString() === day.date.toDateString() && styles.selectedDayText,
                ]}>
                  {day.date.getDate()}
                </Text>
                {day.hasSession && (
                  <View style={styles.sessionDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    const timeSlots = getTimeSlots(selectedDate);
    
    return (
      <Card style={styles.timeSlotsCard}>
        <Card.Content>
          <Title style={styles.timeSlotsTitle}>
            Available Times - {selectedDate.toLocaleDateString()}
          </Title>
          <ScrollView style={styles.timeSlotsContainer} showsVerticalScrollIndicator={false}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  !slot.isAvailable && styles.unavailableTimeSlot,
                  selectedTime && 
                  `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` === slot.time && 
                  styles.selectedTimeSlot,
                ]}
                onPress={() => {
                  const [hours, minutes] = slot.time.split(':').map(Number);
                  const newTime = new Date(selectedDate);
                  newTime.setHours(hours, minutes, 0, 0);
                  setSelectedTime(newTime);
                }}
              >
                <Text style={[
                  styles.timeSlotText,
                  !slot.isAvailable && styles.unavailableTimeSlotText,
                ]}>
                  {slot.time}
                </Text>
                {!slot.isAvailable && (
                  <Text style={styles.conflictText}>
                    Busy: {slot.conflictingUsers.join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {selectedDate && selectedTime && (
            <View style={styles.selectedTimeInfo}>
              <Text style={styles.selectedTimeInfoText}>
                Selected: {selectedDate.toLocaleDateString()} at {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Button
                mode="contained"
                onPress={createSessionAtDateTime}
                style={styles.scheduleButton}
              >
                Schedule Session
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderSessionCreationModal = () => (
    <Modal
      visible={showSessionModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSessionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Title style={styles.modalTitle}>Schedule New Session</Title>
          
          <Text style={styles.sessionDetailText}>
            Date & Time: {selectedDate?.toLocaleDateString()} at{' '}
            {selectedTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <TextInput
            label="Session Notes"
            value={sessionNotes}
            onChangeText={setSessionNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />

          <TextInput
            label="Location (optional)"
            value={sessionLocation}
            onChangeText={setSessionLocation}
            mode="outlined"
            style={styles.modalInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowSessionModal(false);
                setSessionNotes('');
                setSessionLocation('');
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                // TODO: Implement session creation logic
                Alert.alert('Success', 'Session request created! Navigate to matches to complete scheduling.');
                setShowSessionModal(false);
                setSessionNotes('');
                setSessionLocation('');
                // Navigate to matches screen where they can select a partner
                (navigation as any).navigate('Matches');
              }}
              style={styles.modalButton}
            >
              Create
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <Button
        mode={calendarView === 'calendar' ? 'contained' : 'outlined'}
        onPress={() => setCalendarView('calendar')}
        compact
        style={styles.viewToggleButton}
      >
        Calendar
      </Button>
      <Button
        mode={calendarView === 'list' ? 'contained' : 'outlined'}
        onPress={() => setCalendarView('list')}
        compact
        style={styles.viewToggleButton}
      >
        List
      </Button>
    </View>
  );

  const renderSessionCard = (session: Session) => {
    const otherParticipant = getOtherParticipant(session);
    const isTeacher = session.teacherId === user?.id;
    const isPendingSession = session.status === SessionStatus.PENDING;
    const currentSelection = getCurrentSelection();

    const sessionContent = (
      <Card key={session.id} style={styles.sessionCard}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Title style={styles.sessionTitle}>
                {isTeacher ? 'Teaching' : 'Learning'} Session
              </Title>
              <Text style={styles.sessionDate}>{formatDate(session.scheduledAt)}</Text>
            </View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(session.status) }]}
              textStyle={styles.statusText}
            >
              {getStatusText(session.status)}
            </Chip>
          </View>

          <View style={styles.participantInfo}>
            <SafeAvatar 
              size={40} 
              source={otherParticipant?.profileImage ? { uri: otherParticipant.profileImage } : undefined}
              fallbackText={otherParticipant?.name || 'U'}
              style={styles.participantAvatar}
            />
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>
                {otherParticipant?.name || 'Unknown User'}
              </Text>
              <Text style={styles.skillName}>
                Skill: {typeof session.skillId === 'object' && (session.skillId as any)?.name 
                  ? (session.skillId as any).name 
                  : typeof session.skillId === 'string' 
                    ? session.skillId 
                    : 'Unknown Skill'}
              </Text>
            </View>
          </View>

          {session.location && (
            <Text style={styles.location}>📍 {session.location}</Text>
          )}

          {session.notes && (
            <Paragraph style={styles.notes}>{session.notes}</Paragraph>
          )}

          {!isSelectionMode && (
            <View style={styles.sessionActions}>
              <Button 
                mode="outlined" 
                compact
                onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
              >
                View Details
              </Button>
              {isPendingSession && (
                <Button 
                  mode="contained" 
                  compact
                  style={styles.actionButton}
                  onPress={async () => {
                    try {
                      await dispatch(updateSessionStatus({
                        sessionId: session.id,
                        status: SessionStatus.CONFIRMED
                      })).unwrap();
                      
                      // Refresh sessions to reflect changes
                      await loadSessions();
                    } catch (error) {
                      console.error('Failed to confirm/accept session:', error);
                    }
                  }}
                >
                  {isTeacher ? 'Confirm' : 'Accept'}
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );

    if (isSelectionMode && currentSelection) {
      return (
        <SelectableItem
          key={session.id}
          isSelected={currentSelection.isSelected(session)}
          onToggleSelection={() => currentSelection.toggleSelection(session)}
          onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
        >
          {sessionContent}
        </SelectableItem>
      );
    }

    return sessionContent;
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderViewToggle()}
      
      {calendarView === 'calendar' ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderCalendarHeader()}
          {renderCalendarGrid()}
          {renderTimeSlots()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Upcoming Sessions */}
          <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Title style={styles.sectionTitle}>Upcoming Sessions</Title>
            {!isSelectionMode && upcomingSessions.length > 0 && (
              <Button
                mode="outlined"
                onPress={() => handleStartSelection('upcoming')}
                compact
              >
                Select
              </Button>
            )}
          </View>
          
          {/* Selection Header for Upcoming */}
          {isSelectionMode && activeSection === 'upcoming' && (
            <SelectionHeader
              selectedCount={upcomingSelection.getSelectedCount()}
              totalCount={upcomingSessions.length}
              onSelectAll={() => upcomingSelection.selectAll(upcomingSessions)}
              onDeselectAll={() => upcomingSelection.deselectAll()}
              onCancel={handleCancelSelection}
              isAllSelected={upcomingSelection.isAllSelected(upcomingSessions)}
            />
          )}
          
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session, index) => (
              <React.Fragment key={session.id || index}>
                {renderSessionCard(session)}
              </React.Fragment>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>
                  No upcoming sessions. Schedule a session with one of your matches!
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Past Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Title style={styles.sectionTitle}>Past Sessions</Title>
            {!isSelectionMode && pastSessions.length > 0 && (
              <Button
                mode="outlined"
                onPress={() => handleStartSelection('past')}
                compact
              >
                Select
              </Button>
            )}
          </View>
          
          {/* Selection Header for Past */}
          {isSelectionMode && activeSection === 'past' && (
            <SelectionHeader
              selectedCount={pastSelection.getSelectedCount()}
              totalCount={pastSessions.length}
              onSelectAll={() => pastSelection.selectAll(pastSessions)}
              onDeselectAll={() => pastSelection.deselectAll()}
              onCancel={handleCancelSelection}
              isAllSelected={pastSelection.isAllSelected(pastSessions)}
            />
          )}
          
          {pastSessions.length > 0 ? (
            pastSessions.slice(0, 5).map((session, index) => (
              <React.Fragment key={session.id || index}>
                {renderSessionCard(session)}
              </React.Fragment>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>
                  No past sessions yet.
                </Paragraph>
              </Card.Content>
            </Card>
          )}
          {pastSessions.length > 5 && (
            <Button 
              mode="text" 
              style={styles.viewMoreButton}
              onPress={() => {
                // TODO: Navigate to a full past sessions screen
                console.log('View more past sessions');
              }}
            >
              View More Past Sessions
            </Button>
          )}
        </View>
        </ScrollView>
      )}

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {renderSessionCreationModal()}

      {/* Bulk Actions Bar */}
      {isSelectionMode && activeSection && (
        <BulkActionsBar
          selectedCount={getCurrentSelection()?.getSelectedCount() || 0}
          actions={[
            {
              id: 'confirm',
              title: 'Confirm Selected',
              icon: 'check',
              onPress: handleBulkConfirm,
              disabled: (getCurrentSelection()?.getSelectedCount() || 0) === 0,
            },
            {
              id: 'cancel',
              title: 'Cancel Selected',
              icon: 'close',
              onPress: handleBulkCancel,
              destructive: true,
              disabled: (getCurrentSelection()?.getSelectedCount() || 0) === 0,
            },
          ]}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          // Navigate to Matches tab to schedule a session
          (navigation as any).navigate('Matches');
        }}
        label="Schedule"
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
  scrollView: {
    flex: 1,
  },
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewToggleButton: {
    marginHorizontal: 8,
  },
  // Calendar Styles
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekDayText: {
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 1/7 of the width
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#e3f2fd',
  },
  selectedDayCell: {
    backgroundColor: '#2196f3',
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#bbb',
  },
  sessionDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff5722',
  },
  // Time Slots Styles
  timeSlotsCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeSlotsContainer: {
    maxHeight: 200,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedTimeSlot: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  unavailableTimeSlot: {
    backgroundColor: '#ffebee',
    opacity: 0.7,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  unavailableTimeSlotText: {
    color: '#666',
  },
  conflictText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 2,
  },
  selectedTimeInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedTimeInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scheduleButton: {
    paddingHorizontal: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    marginHorizontal: 20,
    borderRadius: 8,
    elevation: 5,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
  },
  // Existing List View Styles
  section: {
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  sessionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    marginLeft: 8,
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
  participantAvatar: {
    borderRadius: 20,
  },
  participantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillName: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  bulkActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
  },
});

export default CalendarScreen;
