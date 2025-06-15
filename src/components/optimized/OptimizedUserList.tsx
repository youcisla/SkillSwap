import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useEntranceAnimation } from '../../hooks/useAnimation';
import { UserProfile } from '../../types';
import SafeAvatar from '../SafeAvatar';
import EnhancedCard from '../ui/EnhancedCard';

interface OptimizedUserListProps {
  users: UserProfile[];
  onUserPress: (user: UserProfile) => void;
  onFollowPress?: (user: UserProfile) => void;
  loading?: boolean;
  error?: string | null;
  style?: ViewStyle;
  horizontal?: boolean;
  showFollowButton?: boolean;
  emptyMessage?: string;
  keyExtractor?: (user: UserProfile) => string;
}

// Memoized user card component for performance
const UserCard = memo<{
  user: UserProfile;
  onPress: (user: UserProfile) => void;
  onFollowPress?: (user: UserProfile) => void;
  showFollowButton: boolean;
  index: number;
}>(({ user, onPress, onFollowPress, showFollowButton, index }) => {
  const theme = useTheme();
  const { opacity, translateY } = useEntranceAnimation(index * 100);

  const handlePress = useCallback(() => {
    onPress(user);
  }, [onPress, user]);

  const handleFollowPress = useCallback(() => {
    onFollowPress?.(user);
  }, [onFollowPress, user]);

  const skillsPreview = useMemo(() => {
    const allSkills = [...(user.skillsToTeach || []), ...(user.skillsToLearn || [])];
    return allSkills.slice(0, 3);
  }, [user.skillsToTeach, user.skillsToLearn]);

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
        style={styles.userCard}
        animationEnabled
      >
        <View style={styles.cardHeader}>
          <SafeAvatar
            size={56}
            source={user.profileImage ? { uri: user.profileImage } : undefined}
            fallbackText={user.name}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onSurface }]}>
              {user.name}
            </Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={[styles.location, { color: theme.colors.onSurfaceVariant }]}>
                {user.city}
              </Text>
            </View>
            {user.rating && (
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons
                  name="star"
                  size={16}
                  color="#FFA000"
                />
                <Text variant="bodySmall" style={styles.rating}>
                  {user.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          {showFollowButton && (
            <Pressable style={styles.followIcon} onPress={handleFollowPress}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={24}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
        </View>

        {skillsPreview.length > 0 && (
          <View style={styles.skillsContainer}>
            {skillsPreview.map((skill, index) => (
              <View key={`${skill?.id}-${index}`} style={[styles.skillChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {skill?.name || 'Unknown Skill'}
                </Text>
              </View>
            ))}
            {(user.skillsToTeach?.length || 0) + (user.skillsToLearn?.length || 0) > 3 && (
              <Text variant="labelSmall" style={[styles.moreSkills, { color: theme.colors.onSurfaceVariant }]}>
                +{(user.skillsToTeach?.length || 0) + (user.skillsToLearn?.length || 0) - 3} more
              </Text>
            )}
          </View>
        )}
      </EnhancedCard>
    </Animated.View>
  );
});

const OptimizedUserList: React.FC<OptimizedUserListProps> = ({
  users,
  onUserPress,
  onFollowPress,
  loading = false,
  error = null,
  style,
  horizontal = false,
  showFollowButton = false,
  emptyMessage = "No users found",
  keyExtractor = (user) => user.id,
}) => {
  const theme = useTheme();

  const renderUser = useCallback(
    ({ item, index }: { item: UserProfile; index: number }) => (
      <UserCard
        user={item}
        onPress={onUserPress}
        onFollowPress={onFollowPress}
        showFollowButton={showFollowButton}
        index={index}
      />
    ),
    [onUserPress, onFollowPress, showFollowButton]
  );

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: horizontal ? 200 : 120,
      offset: (horizontal ? 200 : 120) * index,
      index,
    }),
    [horizontal]
  );

  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="account-search-outline"
          size={64}
          color={theme.colors.outline}
        />
        <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}>
          {emptyMessage}
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
          Error loading users
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
      data={users}
      renderItem={renderUser}
      keyExtractor={keyExtractor}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.listContainer,
        users.length === 0 && styles.emptyListContainer,
        style,
      ]}
      ListEmptyComponent={EmptyComponent}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={6}
      updateCellsBatchingPeriod={50}
      style={styles.list}
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
    marginBottom: 12,
  },
  userCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: '500',
  },
  followIcon: {
    padding: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  moreSkills: {
    marginLeft: 4,
    fontStyle: 'italic',
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

export default memo(OptimizedUserList);
