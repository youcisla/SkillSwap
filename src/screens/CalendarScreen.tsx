import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  FAB,
  Paragraph,
  Text,
  Title,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSessions, updateSessionStatus } from '../store/slices/sessionSlice';
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

  const renderSessionCard = (session: Session) => {
    const otherParticipant = getOtherParticipant(session);
    const isTeacher = session.teacherId === user?.id;

    return (
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
            <Avatar.Image 
              size={40} 
              source={{ uri: otherParticipant?.profileImage || `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#6200ea"/><text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-size="20" font-family="Arial">${(otherParticipant?.name || 'U').charAt(0).toUpperCase()}</text></svg>`)}` }}
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

          <View style={styles.sessionActions}>
            <Button 
              mode="outlined" 
              compact
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
            >
              View Details
            </Button>
            {session.status === SessionStatus.PENDING && (
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
        </Card.Content>
      </Card>
    );
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
          <Title style={styles.sectionTitle}>Upcoming Sessions</Title>
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
          <Title style={styles.sectionTitle}>Past Sessions</Title>
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
  sectionTitle: {
    marginHorizontal: 16,
    marginVertical: 8,
    fontSize: 20,
    fontWeight: 'bold',
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
});

export default CalendarScreen;
