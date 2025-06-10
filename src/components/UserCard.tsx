import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Avatar, Button, Card, Chip, Paragraph, Title } from 'react-native-paper';
import { UserProfile } from '../types';

interface UserCardProps {
  user: UserProfile;
  onPress?: () => void;
  onMessage?: () => void;
  showSkills?: boolean;
  style?: ViewStyle;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  onMessage,
  showSkills = true,
  style
}) => {
  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Avatar.Image
            size={60}
            source={{ 
              uri: user.profileImage || 'https://via.placeholder.com/60/6200ea/ffffff?text=' + user.name.charAt(0)
            }}
          />
          <View style={styles.userInfo}>
            <Title style={styles.name}>{user.name}</Title>
            <Paragraph style={styles.location}>{user.city}</Paragraph>
            {user.rating && (
              <View style={styles.ratingContainer}>
                <Paragraph style={styles.rating}>⭐ {user.rating.toFixed(1)}</Paragraph>
                <Paragraph style={styles.sessions}>({user.totalSessions} sessions)</Paragraph>
              </View>
            )}
          </View>
        </View>

        {user.bio && (
          <Paragraph style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Paragraph>
        )}

        {showSkills && (
          <>
            {user.skillsToTeach.length > 0 && (
              <View style={styles.skillsSection}>
                <Paragraph style={styles.skillsLabel}>Can teach:</Paragraph>
                <View style={styles.skillsContainer}>
                  {user.skillsToTeach.slice(0, 3).map((skill) => (
                    <Chip
                      key={skill.id}
                      style={[styles.skillChip, styles.teachChip]}
                      textStyle={styles.teachChipText}
                      compact
                    >
                      {skill.name}
                    </Chip>
                  ))}
                  {user.skillsToTeach.length > 3 && (
                    <Chip style={styles.moreChip} compact>
                      +{user.skillsToTeach.length - 3}
                    </Chip>
                  )}
                </View>
              </View>
            )}

            {user.skillsToLearn.length > 0 && (
              <View style={styles.skillsSection}>
                <Paragraph style={styles.skillsLabel}>Wants to learn:</Paragraph>
                <View style={styles.skillsContainer}>
                  {user.skillsToLearn.slice(0, 3).map((skill) => (
                    <Chip
                      key={skill.id}
                      style={[styles.skillChip, styles.learnChip]}
                      textStyle={styles.learnChipText}
                      compact
                    >
                      {skill.name}
                    </Chip>
                  ))}
                  {user.skillsToLearn.length > 3 && (
                    <Chip style={styles.moreChip} compact>
                      +{user.skillsToLearn.length - 3}
                    </Chip>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {onMessage && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={onMessage}
              style={styles.messageButton}
              icon="message"
            >
              Message
            </Button>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: 'bold',
  },
  sessions: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  skillsSection: {
    marginBottom: 8,
  },
  skillsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: 6,
    marginBottom: 4,
    height: 28,
  },
  teachChip: {
    backgroundColor: '#e8f5e8',
  },
  teachChipText: {
    color: '#2e7d32',
    fontSize: 12,
  },
  learnChip: {
    backgroundColor: '#e3f2fd',
  },
  learnChipText: {
    color: '#1976d2',
    fontSize: 12,
  },
  moreChip: {
    backgroundColor: '#f5f5f5',
    height: 28,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageButton: {
    borderRadius: 20,
  },
});

export default UserCard;
