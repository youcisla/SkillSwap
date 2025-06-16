import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    FAB,
    Paragraph,
    Text,
    Title
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../components/ui/MultiSelection';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useAppDispatch, useAppSelector } from '../store';
import { cancelSession, fetchSessions, updateSessionStatus } from '../store/slices/sessionSlice';
import { CalendarStackParamList, Session, SessionStatus } from '../types';

type CalendarScreenNavigationProp = StackNavigationProp<CalendarStackParamList, 'CalendarMain'>;

interface Props {
  navigation: CalendarScreenNavigationProp;
}

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { users } = useAppSelector((state) => state.user);

  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'upcoming' | 'past' | null>(null);

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
              <Text style={styles.skillName}>Skill: {session.skillId}</Text>
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
            upcomingSessions.map(renderSessionCard)
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
            pastSessions.slice(0, 5).map(renderSessionCard)
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
