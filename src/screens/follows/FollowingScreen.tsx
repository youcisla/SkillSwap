import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    Paragraph,
    Searchbar,
    Text,
    Title
} from 'react-native-paper';
import SafeAvatar from '../../components/SafeAvatar';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchFollowing, unfollowUser } from '../../store/slices/followSlice';
import { FollowUser, ProfileStackParamList } from '../../types';

type FollowingScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Following'>;
type FollowingScreenRouteProp = RouteProp<ProfileStackParamList, 'Following'>;

interface Props {
  navigation: FollowingScreenNavigationProp;
  route: FollowingScreenRouteProp;
}

const FollowingScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { following, loading } = useAppSelector((state) => state.follows);

  const { userId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isOwnProfile = userId === user?.id;

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    try {
      await dispatch(fetchFollowing({ userId })).unwrap();
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFollowing();
    setRefreshing(false);
  };

  const handleUnfollow = async (followingId: string) => {
    try {
      await dispatch(unfollowUser(followingId)).unwrap();
      // Refresh the list to reflect changes
      await loadFollowing();
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  const filteredFollowing = following.filter(followedUser =>
    followedUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartChat = (followingId: string) => {
    const sortedIds = [user?.id, followingId].sort();
    const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
    
    try {
      (navigation as any).navigate('Messages', {
        screen: 'MessageChat',
        params: { chatId, otherUserId: followingId }
      });
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const renderFollowingItem = ({ item: followedUser }: { item: FollowUser }) => (
    <Card style={styles.followingCard}>
      <Card.Content>
        <View style={styles.followingHeader}>
          <SafeAvatar 
            size={50} 
            source={followedUser.profileImage ? { uri: followedUser.profileImage } : undefined}
            fallbackText={followedUser.name}
            style={styles.followingAvatar}
          />
          <View style={styles.followingInfo}>
            <Title style={styles.followingName}>{followedUser.name}</Title>
            <Paragraph style={styles.followingCity}>{followedUser.city}</Paragraph>
            {followedUser.rating && followedUser.rating > 0 && (
              <Text style={styles.rating}>
                ⭐ {followedUser.rating.toFixed(1)} ({followedUser.totalSessions || 0} sessions)
              </Text>
            )}
            <Text style={styles.followDate}>
              Following since {formatDate(followedUser.followedAt)}
            </Text>
          </View>
        </View>

        {/* Show some skills */}
        {followedUser.skillsToTeach && followedUser.skillsToTeach.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsLabel}>Can teach:</Text>
            <View style={styles.skillsContainer}>
              {followedUser.skillsToTeach.slice(0, 3).map((skill) => (
                <Chip key={skill.id} style={styles.teachChip} compact>
                  {skill.name}
                </Chip>
              ))}
              {followedUser.skillsToTeach.length > 3 && (
                <Chip style={styles.moreChip} compact>
                  +{followedUser.skillsToTeach.length - 3}
                </Chip>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ProfileMain', { userId: followedUser.id })}
            style={styles.actionButton}
          >
            View Profile
          </Button>
          <Button
            mode="contained"
            onPress={() => handleStartChat(followedUser.id)}
            style={styles.actionButton}
          >
            Message
          </Button>
          {isOwnProfile && (
            <Button
              mode="outlined"
              onPress={() => handleUnfollow(followedUser.id)}
              style={[styles.actionButton, styles.unfollowButton]}
              textColor="#d32f2f"
            >
              Unfollow
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {isOwnProfile ? "You're not following anyone yet" : "Not following anyone"}
      </Text>
      <Paragraph style={styles.emptyStateText}>
        {isOwnProfile 
          ? "Discover interesting people and follow them to stay updated with their activities!"
          : "This user isn't following anyone yet."
        }
      </Paragraph>
      {isOwnProfile && (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('HomeMain')}
          style={styles.exploreButton}
        >
          Explore Users
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search following..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredFollowing}
        renderItem={renderFollowingItem}
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
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  followingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  followingHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  followingAvatar: {
    borderRadius: 25,
  },
  followingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followingName: {
    fontSize: 18,
    marginBottom: 4,
  },
  followingCity: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  rating: {
    color: '#ff9800',
    fontSize: 12,
    marginBottom: 4,
  },
  followDate: {
    color: '#999',
    fontSize: 12,
  },
  skillsSection: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teachChip: {
    backgroundColor: '#e3f2fd',
  },
  moreChip: {
    backgroundColor: '#f5f5f5',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  unfollowButton: {
    borderColor: '#d32f2f',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exploreButton: {
    marginTop: 10,
  },
});

export default FollowingScreen;
