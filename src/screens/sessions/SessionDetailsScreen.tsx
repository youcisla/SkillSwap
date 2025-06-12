import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
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
  Divider,
  Paragraph,
  Text,
  Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList, Session, SessionStatus } from '../../types';

type SessionDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SessionDetails'>;
type SessionDetailsScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetails'>;

interface Props {
  navigation: SessionDetailsScreenNavigationProp;
  route: SessionDetailsScreenRouteProp;
}

const SessionDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentSession, loading } = useAppSelector((state) => state.sessions);

  const sessionId = route.params?.sessionId;

  // Mock session data for demo
  const [session] = useState<Session>({
    id: sessionId || '1',
    teacherId: 'teacher1',
    studentId: 'student1',
    skillId: 'skill1',
    status: SessionStatus.CONFIRMED,
    scheduledAt: new Date('2025-06-15T14:00:00'),
    location: 'Central Library, Meeting Room 2',
    notes: 'Bring your guitar and any music sheets you want to work on.',
    createdAt: new Date('2025-06-10T10:00:00'),
    updatedAt: new Date('2025-06-10T10:00:00'),
  });

  // Mock user data
  const otherUser = {
    id: session.teacherId === user?.id ? session.studentId : session.teacherId,
    name: session.teacherId === user?.id ? 'Alice Johnson' : 'Bob Smith',
    profileImage: 'https://via.placeholder.com/100',
    rating: 4.8,
  };

  const skillName = 'Guitar Playing';
  const isTeacher = session.teacherId === user?.id;

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
        return '#757575';
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.PENDING:
        return 'Pending Confirmation';
      case SessionStatus.CONFIRMED:
        return 'Confirmed';
      case SessionStatus.COMPLETED:
        return 'Completed';
      case SessionStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Session',
      'Are you sure you want to confirm this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // In a real app, dispatch action to update session status
            console.log('Confirming session:', sessionId);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            // In a real app, dispatch action to cancel session
            console.log('Cancelling session:', sessionId);
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert(
      'Mark as Complete',
      'Mark this session as completed?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            // In a real app, navigate to feedback screen
            console.log('Completing session:', sessionId);
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    // Generate consistent chat ID
    const sortedIds = [user?.id, otherUser.id].sort();
    const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
    
    // SessionDetails is in CalendarStack which doesn't have Chat screens
    // For now, just log - in a real app you'd navigate to Messages tab
    console.log('Navigate to chat:', { chatId, otherUserId: otherUser.id });
    // TODO: Implement navigation to Messages tab
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Session Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>{skillName} Session</Title>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(session.status) }]}
                textStyle={styles.statusText}
              >
                {getStatusText(session.status)}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Participant Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {isTeacher ? 'Student' : 'Teacher'}
            </Title>
            <View style={styles.userInfo}>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{otherUser.name}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ {otherUser.rating}</Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleMessage}
                compact
              >
                Message
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Session Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Session Details</Title>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Date & Time:</Text>
              <Text style={styles.value}>
                {session.scheduledAt.toLocaleDateString()} at {session.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{session.location || 'TBD'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Role:</Text>
              <Text style={styles.value}>
                You are the {isTeacher ? 'Teacher' : 'Student'}
              </Text>
            </View>

            {session.notes && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.label}>Notes:</Text>
                <Paragraph style={styles.notes}>{session.notes}</Paragraph>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Actions</Title>
            
            {session.status === SessionStatus.PENDING && (
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  style={styles.actionButton}
                >
                  Confirm Session
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.actionButton}
                >
                  Cancel Session
                </Button>
              </View>
            )}

            {session.status === SessionStatus.CONFIRMED && (
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  onPress={handleComplete}
                  style={styles.actionButton}
                >
                  Mark as Complete
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.actionButton}
                >
                  Cancel Session
                </Button>
              </View>
            )}

            {session.status === SessionStatus.COMPLETED && (
              <Text style={styles.completedText}>
                This session has been completed. Thank you for using SkillSwap!
              </Text>
            )}

            {session.status === SessionStatus.CANCELLED && (
              <Text style={styles.cancelledText}>
                This session was cancelled.
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#6200ea',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#4caf50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelledText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SessionDetailsScreen;
