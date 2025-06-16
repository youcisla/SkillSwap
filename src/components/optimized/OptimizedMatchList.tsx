import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { useEntranceAnimation } from '../../hooks/useAnimation';
import { Match, UserProfile } from '../../types';
import SafeAvatar from '../SafeAvatar';
import EnhancedCard from '../ui/EnhancedCard';

interface OptimizedMatchListProps {
  matches: Match[];
  users: UserProfile[];
  currentUserId: string;
  onMatchPress: (match: Match) => void;
  onMessagePress?: (match: Match) => void;
  onUnmatchPress?: (match: Match) => void;
  loading?: boolean;
  error?: string | null;
  style?: ViewStyle;
  emptyMessage?: string;
}

// Memoized match card component for performance
const MatchCard = memo<{
  match: Match;
  matchedUser: UserProfile | undefined;
  skills: string[];
  onPress: (match: Match) => void;
  onMessagePress?: (match: Match) => void;
  onUnmatchPress?: (match: Match) => void;
  index: number;
}>(({ match, matchedUser, skills, onPress, onMessagePress, onUnmatchPress, index }) => {
  const theme = useTheme();
  const { opacity, translateY } = useEntranceAnimation(index * 100);

  const handlePress = useCallback(() => {
    onPress(match);
  }, [onPress, match]);

  const handleMessagePress = useCallback(() => {
    onMessagePress?.(match);
  }, [onMessagePress, match]);

  const handleUnmatchPress = useCallback(() => {
    onUnmatchPress?.(match);
  }, [onUnmatchPress, match]);

  const compatibilityColor = useMemo(() => {
    const score = match.compatibilityScore;
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#F44336';
  }, [match.compatibilityScore]);

  const skillsToShow = useMemo(() => skills.slice(0, 3), [skills]);

  if (!matchedUser) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <EnhancedCard
        variant="elevated"
        onPress={handlePress}
        style={styles.matchCard}
        animationEnabled
      >
        <View style={styles.cardHeader}>
          <SafeAvatar
            size={60}
            source={matchedUser.profileImage ? { uri: matchedUser.profileImage } : undefined}
            fallbackText={matchedUser.name}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onSurface }]}>
              {matchedUser.name}
            </Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={[styles.location, { color: theme.colors.onSurfaceVariant }]}>
                {matchedUser.city}
              </Text>
            </View>
            <View style={styles.compatibilityRow}>
              <MaterialCommunityIcons
                name="heart"
                size={16}
                color={compatibilityColor}
              />
              <Text variant="bodySmall" style={[styles.compatibility, { color: compatibilityColor }]}>
                {match.compatibilityScore}% match
              </Text>
            </View>
          </View>
        </View>

        {skillsToShow.length > 0 && (
          <View style={styles.skillsSection}>
            <Text variant="labelMedium" style={[styles.skillsTitle, { color: theme.colors.onSurface }]}>
              Shared Skills
            </Text>
            <View style={styles.skillsContainer}>
              {skillsToShow.map((skill, index) => (
                <Chip
                  key={`${skill}-${match.id || `${match.user1Id}-${match.user2Id}`}-${index}`}
                  compact
                  style={[styles.skillChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  {skill}
                </Chip>
              ))}
              {skills.length > 3 && (
                <Text variant="labelSmall" style={[styles.moreSkills, { color: theme.colors.onSurfaceVariant }]}>
                  +{skills.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          {onMessagePress && (
            <Pressable style={styles.actionButton} onPress={handleMessagePress}>
              <MaterialCommunityIcons
                name="message-outline"
                size={24}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
          {onUnmatchPress && (
            <Pressable style={styles.actionButton} onPress={handleUnmatchPress}>
              <MaterialCommunityIcons
                name="heart-broken-outline"
                size={24}
                color={theme.colors.error}
              />
            </Pressable>
          )}
        </View>
      </EnhancedCard>
    </Animated.View>
  );
});

const OptimizedMatchList: React.FC<OptimizedMatchListProps> = ({
  matches,
  users,
  currentUserId,
  onMatchPress,
  onMessagePress,
  onUnmatchPress,
  loading = false,
  error = null,
  style,
  emptyMessage = "No matches found",
}) => {
  const theme = useTheme();

  const matchesWithUsers = useMemo(() => {
    return matches.map(match => {
      const matchData = match as any;
      
      // Extract user IDs from match data
      const user1Id = typeof matchData.user1Id === 'object' ? matchData.user1Id.id || matchData.user1Id._id : matchData.user1Id;
      const user2Id = typeof matchData.user2Id === 'object' ? matchData.user2Id.id || matchData.user2Id._id : matchData.user2Id;
      
      // Find the other user
      let matchedUser: UserProfile | undefined;
      let skills: string[] = [];
      
      if (String(user1Id) === String(currentUserId)) {
        if (typeof matchData.user2Id === 'object') {
          matchedUser = matchData.user2Id;
        } else {
          matchedUser = users.find(u => String(u.id) === String(user2Id));
        }
        skills = Array.isArray(match.user1Skills) ? match.user1Skills : [];
      } else if (String(user2Id) === String(currentUserId)) {
        if (typeof matchData.user1Id === 'object') {
          matchedUser = matchData.user1Id;
        } else {
          matchedUser = users.find(u => String(u.id) === String(user1Id));
        }
        skills = Array.isArray(match.user2Skills) ? match.user2Skills : [];
      }
      
      return {
        match,
        matchedUser,
        skills,
      };
    }).filter(item => item.matchedUser);
  }, [matches, users, currentUserId]);

  const renderMatch = useCallback(
    ({ item, index }: { item: typeof matchesWithUsers[0]; index: number }) => (
      <MatchCard
        match={item.match}
        matchedUser={item.matchedUser}
        skills={item.skills}
        onPress={onMatchPress}
        onMessagePress={onMessagePress}
        onUnmatchPress={onUnmatchPress}
        index={index}
      />
    ),
    [onMatchPress, onMessagePress, onUnmatchPress]
  );

  const keyExtractor = useCallback(
    (item: typeof matchesWithUsers[0]) => {
      return String(item.match.id || `${item.match.user1Id}-${item.match.user2Id}`);
    },
    []
  );

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 180,
      offset: 180 * index,
      index,
    }),
    []
  );

  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="heart-outline"
          size={64}
          color={theme.colors.outline}
        />
        <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}>
          {emptyMessage}
        </Text>
        <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Start by adding skills you want to teach or learn
        </Text>
      </View>
    ),
    [theme.colors.outline, theme.colors.onSurfaceVariant, emptyMessage]
  );

  const ErrorComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.error}
        />
        <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.error }]}>
          Error loading matches
        </Text>
        <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {error}
        </Text>
      </View>
    ),
    [theme.colors.error, theme.colors.onSurfaceVariant, error]
  );

  if (error) {
    return ErrorComponent;
  }

  return (
    <FlatList
      data={matchesWithUsers}
      renderItem={renderMatch}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContainer,
        matchesWithUsers.length === 0 && styles.emptyListContainer,
        style,
      ]}
      ListEmptyComponent={EmptyComponent}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={8}
      initialNumToRender={4}
      updateCellsBatchingPeriod={50}
      style={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    marginBottom: 16,
  },
  matchCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    marginLeft: 4,
  },
  compatibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibility: {
    marginLeft: 4,
    fontWeight: '600',
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillChip: {
    marginRight: 6,
    marginBottom: 4,
  },
  moreSkills: {
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default memo(OptimizedMatchList);
