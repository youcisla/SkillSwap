import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Paragraph,
  Searchbar,
  SegmentedButtons,
  Text,
  Title,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { checkFollowStatus, followUser, unfollowUser } from '../store/slices/followSlice';
import { searchUsers } from '../store/slices/userSlice';
import { HomeStackParamList, UserProfile } from '../types';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

type UserListScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'UserList'>;
type UserListScreenRouteProp = RouteProp<HomeStackParamList, 'UserList'>;

interface Props {
  navigation: UserListScreenNavigationProp;
  route: UserListScreenRouteProp;
}

const UserListScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users, loading, error } = useAppSelector((state) => state.user);
  const { currentUser } = useAppSelector((state) => state.user);
  const { isFollowing } = useAppSelector((state) => state.follows);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const initialSkillId = route.params?.skillId;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load users when debounced search query or filter changes
  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [debouncedSearchQuery, filterType, currentUser?.id]);

  useEffect(() => {
    if (initialSkillId) {
      setSearchQuery(initialSkillId);
    }
  }, [initialSkillId]);

  const loadUsers = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping search');
      return;
    }

    try {
      const filters: any = {};

      // Apply skill-based filters
      if (filterType === 'teachers' && currentUser?.skillsToLearn && currentUser.skillsToLearn.length > 0) {
        // Find users who can teach what current user wants to learn
        filters.skillsToTeach = currentUser.skillsToLearn.map(skill => skill.name);
      } else if (filterType === 'students' && currentUser?.skillsToTeach && currentUser.skillsToTeach.length > 0) {
        // Find users who want to learn what current user can teach
        filters.skillsToLearn = currentUser.skillsToTeach.map(skill => skill.name);
      }

      console.log('Search parameters:', { query: debouncedSearchQuery, filters, filterType });
      
      await dispatch(searchUsers({ 
        query: debouncedSearchQuery || '', 
        filters: Object.keys(filters).length > 0 ? filters : undefined 
      })).unwrap();
      
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [dispatch, debouncedSearchQuery, filterType, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      const currentFollowStatus = isFollowing[userId];
      if (currentFollowStatus) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    }
  };

  // Check follow status for all users when they load
  useEffect(() => {
    if (users.length > 0 && user?.id) {
      users.forEach(userProfile => {
        if (userProfile.id !== user.id) {
          dispatch(checkFollowStatus(userProfile.id));
        }
      });
    }
  }, [users, user?.id]);

  const getCompatibilityScore = (otherUser: UserProfile) => {
    if (!currentUser) return 0;

    const myTeachSkills = currentUser.skillsToTeach?.map(s => s.name) || [];
    const myLearnSkills = currentUser.skillsToLearn?.map(s => s.name) || [];
    const theirTeachSkills = otherUser.skillsToTeach?.map(s => s.name) || [];
    const theirLearnSkills = otherUser.skillsToLearn?.map(s => s.name) || [];

    const canTeachThem = myTeachSkills.filter(skill => theirLearnSkills.includes(skill));
    const canLearnFromThem = theirTeachSkills.filter(skill => myLearnSkills.includes(skill));

    const totalPossibleMatches = Math.max(myTeachSkills.length + myLearnSkills.length, 1);
    const actualMatches = canTeachThem.length + canLearnFromThem.length;

    return Math.round((actualMatches / totalPossibleMatches) * 100);
  };

  const filteredUsers = users
    .filter(u => u.id !== user?.id) // Exclude current user
    .sort((a, b) => {
      const scoreA = getCompatibilityScore(a);
      const scoreB = getCompatibilityScore(b);
      
      // First sort by compatibility score (descending)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // Then by name (ascending) for consistent ordering
      return a.name.localeCompare(b.name);
    });

  // Debug logging
  console.log('All users from Redux state:', users.length);
  console.log('Current user ID:', user?.id);
  console.log('Filtered users count:', filteredUsers.length);
  console.log('Filter type:', filterType);

  const renderUserItem = ({ item: userProfile }: { item: UserProfile }) => {
    const compatibilityScore = getCompatibilityScore(userProfile);
    
    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <Avatar.Image 
              size={50} 
              source={{ uri: userProfile.profileImage || `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="#6200ea"/><text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-size="24" font-family="Arial">${userProfile.name.charAt(0).toUpperCase()}</text></svg>`)}` }}
            />
            <View style={styles.userInfo}>
              <Title>{userProfile.name}</Title>
              <Paragraph>{userProfile.city}</Paragraph>
              {userProfile.rating && userProfile.rating > 0 && (
                <Text style={styles.rating}>
                  ⭐ {userProfile.rating.toFixed(1)} ({userProfile.totalSessions || 0} sessions)
                </Text>
              )}
            </View>
            {compatibilityScore > 0 && (
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>
                  {compatibilityScore}%
                </Text>
              </View>
            )}
          </View>

          {userProfile.bio && (
            <Paragraph style={styles.bio} numberOfLines={2}>
              {userProfile.bio}
            </Paragraph>
          )}

          {/* Skills they can teach */}
          {userProfile.skillsToTeach && userProfile.skillsToTeach.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.skillsLabel}>Can teach:</Text>
              <View style={styles.skillsContainer}>
                {userProfile.skillsToTeach.slice(0, 3).map((skill) => (
                  <Chip key={skill.id} style={styles.teachChip} compact>
                    {skill.name}
                  </Chip>
                ))}
                {userProfile.skillsToTeach.length > 3 ? (
                  <Text style={styles.moreSkills}>
                    +{userProfile.skillsToTeach.length - 3} more
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Skills they want to learn */}
          {userProfile.skillsToLearn && userProfile.skillsToLearn.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.skillsLabel}>Wants to learn:</Text>
              <View style={styles.skillsContainer}>
                {userProfile.skillsToLearn.slice(0, 3).map((skill) => (
                  <Chip key={skill.id} style={styles.learnChip} compact>
                    {skill.name}
                  </Chip>
                ))}
                {userProfile.skillsToLearn.length > 3 ? (
                  <Text style={styles.moreSkills}>
                    +{userProfile.skillsToLearn.length - 3} more
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('UserProfile', { userId: userProfile.id })}
              style={styles.actionButton}
            >
              View Profile
            </Button>
            <Button
              mode={isFollowing[userProfile.id] ? "outlined" : "contained"}
              onPress={() => handleFollowToggle(userProfile.id)}
              style={[styles.actionButton, styles.followButton]}
              icon={isFollowing[userProfile.id] ? "account-minus" : "account-plus"}
              buttonColor={isFollowing[userProfile.id] ? undefined : "#6200ea"}
              textColor={isFollowing[userProfile.id] ? "#6200ea" : undefined}
            >
              {isFollowing[userProfile.id] ? "Unfollow" : "Follow"}
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                const sortedIds = [user?.id, userProfile.id].sort();
                const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
                navigation.navigate('HomeChat', { 
                  chatId, 
                  otherUserId: userProfile.id 
                });
              }}
              style={styles.actionButton}
            >
              Message
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {loading ? 'Searching...' : error ? 'Search Error' : 'No users found'}
      </Text>
      <Paragraph style={styles.emptyStateText}>
        {loading 
          ? 'Finding users that match your criteria...'
          : error
            ? `Error: ${error}. Please try again.`
            : filterType === 'all' 
              ? 'Try adjusting your search or check back later.'
              : filterType === 'teachers'
                ? 'No users found who can teach the skills you want to learn. Try expanding your learning interests.'
                : 'No users found who want to learn the skills you can teach. Consider adding more teaching skills.'
        }
      </Paragraph>
      {error && (
        <Button 
          mode="outlined" 
          onPress={() => loadUsers()}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search users or skills..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={[
            { value: 'all', label: 'All Users' },
            { 
              value: 'teachers', 
              label: 'Can Teach Me',
              disabled: !currentUser?.skillsToLearn || currentUser.skillsToLearn.length === 0
            },
            { 
              value: 'students', 
              label: 'Want to Learn',
              disabled: !currentUser?.skillsToTeach || currentUser.skillsToTeach.length === 0
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'white',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userCard: {
    marginVertical: 8,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rating: {
    color: '#666',
    fontSize: 14,
  },
  compatibilityBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  compatibilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bio: {
    marginBottom: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  skillsSection: {
    marginBottom: 8,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#666',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  teachChip: {
    margin: 2,
    backgroundColor: '#e3f2fd',
  },
  learnChip: {
    margin: 2,
    backgroundColor: '#f3e5f5',
  },
  moreSkills: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  followButton: {
    minWidth: 100,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
  },
});

export default UserListScreen;
