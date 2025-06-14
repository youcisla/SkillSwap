import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Avatar, Button, Card, Chip, Paragraph, Title } from 'react-native-paper';
import { Session, SessionStatus } from '../types';

interface SessionCardProps {
  session: Session;
  currentUserId: string;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  currentUserId,
  onPress,
  onAccept,
  onDecline,
  onCancel,
  style
}) => {
  const isTeacher = session.teacherId === currentUserId;
  const otherUser = isTeacher ? 'Student' : 'Teacher';
  
  const getStatusColor = (status: SessionStatus): string => {
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

  const getStatusIcon = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.PENDING:
        return 'clock';
      case SessionStatus.CONFIRMED:
        return 'check-circle';
      case SessionStatus.COMPLETED:
        return 'check-all';
      case SessionStatus.CANCELLED:
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPending = session.status === SessionStatus.PENDING;
  const isUpcoming = new Date(session.scheduledAt) > new Date();
  const canAcceptDecline = isPending && !isTeacher && isUpcoming;
  const canCancel = isPending && isUpcoming;

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.sessionInfo}>
            <Title style={styles.skillName}>Guitar Lesson</Title>
            <View style={styles.statusContainer}>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(session.status) + '20' }]}
                textStyle={[styles.statusText, { color: getStatusColor(session.status) }]}
                icon={getStatusIcon(session.status)}
                compact
              >
                {session.status.toUpperCase()}
              </Chip>
            </View>
          </View>
          
          <Avatar.Icon
            size={48}
            icon={isTeacher ? 'account-voice' : 'account-student'}
            style={[styles.roleIcon, { backgroundColor: isTeacher ? '#4caf50' : '#2196f3' }]}
          />
        </View>

        <View style={styles.details}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Paragraph style={styles.label}>Date</Paragraph>
              <Paragraph style={styles.value}>{formatDate(session.scheduledAt)}</Paragraph>
            </View>
            <View style={styles.dateTime}>
              <Paragraph style={styles.label}>Time</Paragraph>
              <Paragraph style={styles.value}>{formatTime(session.scheduledAt)}</Paragraph>
            </View>
          </View>

          {session.location && (
            <View style={styles.locationContainer}>
              <Paragraph style={styles.label}>Location</Paragraph>
              <Paragraph style={styles.value}>{session.location}</Paragraph>
            </View>
          )}

          {session.notes && (
            <View style={styles.notesContainer}>
              <Paragraph style={styles.label}>Notes</Paragraph>
              <Paragraph style={styles.notes} numberOfLines={2}>
                {session.notes}
              </Paragraph>
            </View>
          )}
        </View>

        {(canAcceptDecline || canCancel) && (
          <View style={styles.actions}>
            {canAcceptDecline && (
              <>
                <Button
                  mode="outlined"
                  onPress={onDecline}
                  style={[styles.actionButton, styles.declineButton]}
                  labelStyle={styles.declineButtonText}
                >
                  Decline
                </Button>
                <Button
                  mode="contained"
                  onPress={onAccept}
                  style={[styles.actionButton, styles.acceptButton]}
                >
                  Accept
                </Button>
              </>
            )}
            
            {canCancel && (
              <Button
                mode="outlined"
                onPress={onCancel}
                style={[styles.actionButton, styles.cancelButton]}
                labelStyle={styles.cancelButtonText}
              >
                Cancel
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleIcon: {
    marginLeft: 16,
  },
  details: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateTime: {
    flex: 1,
  },
  locationContainer: {
    marginBottom: 12,
  },
  notesContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
    minWidth: 80,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  declineButton: {
    borderColor: '#f44336',
  },
  declineButtonText: {
    color: '#f44336',
  },
  cancelButton: {
    borderColor: '#ff9800',
  },
  cancelButtonText: {
    color: '#ff9800',
  },
});

export default SessionCard;
