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
import { fetchSessions } from '../store/slices/sessionSlice';
import { RootStackParamList, Session, SessionStatus } from '../types';

type CalendarScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Calendar'>;

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
              source={{ uri: otherParticipant?.profileImage || 'https://via.placeholder.com/40' }}
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
            <Button mode="text" style={styles.viewMoreButton}>
              View More Past Sessions
            </Button>
          )}
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Matches')}
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
    color: '#6200ea',
  },
  sessionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    fontSize: 18,
    marginBottom: 4,
  },
  sessionDate: {
    color: '#666',
    fontSize: 14,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  skillName: {
    color: '#666',
    fontSize: 14,
  },
  location: {
    marginVertical: 4,
    color: '#666',
  },
  notes: {
    marginVertical: 8,
    fontStyle: 'italic',
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  },
  viewMoreButton: {
    marginHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;
