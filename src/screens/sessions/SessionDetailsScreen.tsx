import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
  Divider,
  Paragraph,
  Text,
  Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { cancelSession, completeSession, fetchSessionById, updateSessionStatus } from '../../store/slices/sessionSlice';
import { RootStackParamList, SessionStatus } from '../../types';

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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch session data when component mounts
  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId));
    }
  }, [sessionId, dispatch]);

  // Use real session data from Redux store
  const session = currentSession;

  if (!session && !loading) {
    return (
      <View style={styles.container}>
        <Text>Session not found</Text>
      </View>
    );
  }

  if (loading || !session) {
    return (
      <View style={styles.container}>
        <Text>Loading session details...</Text>
      </View>
    );
  }

  // Get other participant information from populated session data
  const isTeacher = session.teacherId === user?.id;
  const otherUser = isTeacher 
    ? (session as any).studentId // Backend populates this with user object
    : (session as any).teacherId; // Backend populates this with user object

  // Get skill information from populated session data
  const skillInfo = (session as any).skillId; // Backend populates this with skill object
  const skillName = skillInfo?.name || 'Unknown Skill';

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

  const handleConfirm = async () => {
    if (!sessionId) return;
    
    Alert.alert(
      'Confirm Session',
      'Are you sure you want to confirm this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsLoading(true);
              await dispatch(updateSessionStatus({ 
                sessionId, 
                status: SessionStatus.CONFIRMED 
              })).unwrap();
              Alert.alert('Success', 'Session confirmed successfully!');
            } catch (error) {
              console.error('Failed to confirm session:', error);
              Alert.alert('Error', 'Failed to confirm session. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!sessionId) return;
    
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await dispatch(cancelSession({ 
                sessionId, 
                reason: 'Cancelled by user' 
              })).unwrap();
              Alert.alert('Success', 'Session cancelled successfully.');
            } catch (error) {
              console.error('Failed to cancel session:', error);
              Alert.alert('Error', 'Failed to cancel session. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    
    Alert.alert(
      'Mark as Complete',
      'Mark this session as completed? You can add feedback after marking it complete.',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setIsLoading(true);
              // For now, complete without feedback - could add feedback screen later
              await dispatch(completeSession({ 
                sessionId 
              })).unwrap();
              Alert.alert('Success', 'Session marked as complete! Thank you for using SkillSwap.');
            } catch (error) {
              console.error('Failed to complete session:', error);
              Alert.alert('Error', 'Failed to mark session as complete. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    if (!otherUser?.id && !otherUser?._id) {
      Alert.alert('Error', 'Unable to start chat - user information not available.');
      return;
    }
    
    // Get the other user's ID (handle both id and _id fields)
    const otherUserId = otherUser.id || otherUser._id;
    
    // Generate consistent chat ID
    const sortedIds = [user?.id, otherUserId].sort();
    const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
    
    // Navigate to Messages tab and then to chat
    try {
      (navigation as any).navigate('Messages', {
        screen: 'MessageChat',
        params: { chatId, otherUserId }
      });
    } catch (error) {
      console.log('Navigation to Messages tab failed:', error);
      // Fallback navigation
      Alert.alert('Navigation Error', 'Unable to open chat. Please try again.');
    }
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
                <Text style={styles.userName}>
                  {otherUser?.name || 'Unknown User'}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>
                    ⭐ {otherUser?.rating ? otherUser.rating.toFixed(1) : 'No rating'}
                  </Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleMessage}
                compact
                disabled={isLoading}
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
                {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            <View style={styles.detailRow}>
              <Text style={styles.label}>Skill:</Text>
              <Text style={styles.value}>{skillName}</Text>
            </View>

            {skillInfo?.category && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{skillInfo.category}</Text>
              </View>
            )}

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
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Confirm Session
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.actionButton}
                  loading={isLoading}
                  disabled={isLoading}
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
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Mark as Complete
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.actionButton}
                  loading={isLoading}
                  disabled={isLoading}
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
