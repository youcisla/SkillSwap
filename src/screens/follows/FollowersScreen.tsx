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
import { fetchFollowers } from '../../store/slices/followSlice';
import { FollowUser, ProfileStackParamList } from '../../types';

type FollowersScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Followers'>;
type FollowersScreenRouteProp = RouteProp<ProfileStackParamList, 'Followers'>;

interface Props {
  navigation: FollowersScreenNavigationProp;
  route: FollowersScreenRouteProp;
}

const FollowersScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { followers, loading } = useAppSelector((state) => state.follows);

  const { userId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async () => {
    try {
      await dispatch(fetchFollowers({ userId })).unwrap();
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFollowers();
    setRefreshing(false);
  };

  const filteredFollowers = followers.filter(follower =>
    follower.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartChat = (followerId: string) => {
    const sortedIds = [user?.id, followerId].sort();
    const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
    
    try {
      (navigation as any).navigate('Messages', {
        screen: 'MessageChat',
        params: { chatId, otherUserId: followerId }
      });
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const renderFollowerItem = useCallback(({ item: follower }: { item: FollowUser }) => (
    <Card style={styles.followerCard}>
      <Card.Content>
        <View style={styles.followerHeader}>
          <SafeAvatar 
            size={50} 
            source={follower.profileImage ? { uri: follower.profileImage } : undefined}
            fallbackText={follower.name}
            style={styles.followerAvatar}
          />
          <View style={styles.followerInfo}>
            <Title style={styles.followerName}>{follower.name}</Title>
            <Paragraph style={styles.followerCity}>{follower.city}</Paragraph>
            {follower.rating && follower.rating > 0 && (
              <Text style={styles.rating}>
                ⭐ {follower.rating.toFixed(1)} ({follower.totalSessions || 0} sessions)
              </Text>
            )}
            <Text style={styles.followDate}>
              Followed since {formatDate(follower.followedAt)}
            </Text>
          </View>
        </View>

        {/* Show some skills */}
        {follower.skillsToTeach && follower.skillsToTeach.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsLabel}>Can teach:</Text>
            <View style={styles.skillsContainer}>
              {follower.skillsToTeach.slice(0, 3).map((skill) => (
                <Chip key={skill.id} style={styles.teachChip} compact>
                  {skill.name}
                </Chip>
              ))}
              {follower.skillsToTeach.length > 3 && (
                <Chip style={styles.moreChip} compact>
                  <Text>+{follower.skillsToTeach.length - 3}</Text>
                </Chip>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ProfileMain', { userId: follower.id })}
            style={styles.actionButton}
          >
            View Profile
          </Button>
          <Button
            mode="contained"
            onPress={() => handleStartChat(follower.id)}
            style={styles.actionButton}
          >
            Message
          </Button>
        </View>
      </Card.Content>
    </Card>
  ), [navigation, handleStartChat]);

  const keyExtractor = useCallback((item: FollowUser) => item.id, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {userId === user?.id ? "You don't have any followers yet" : "No followers"}
      </Text>
      <Paragraph style={styles.emptyStateText}>
        {userId === user?.id 
          ? "Build connections by engaging with other users and sharing your skills!"
          : "This user doesn't have any followers yet."
        }
      </Paragraph>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search followers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredFollowers}
        renderItem={renderFollowerItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
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
  followerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  followerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  followerAvatar: {
    borderRadius: 25,
  },
  followerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followerName: {
    fontSize: 18,
    marginBottom: 4,
  },
  followerCity: {
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  },
});

export default FollowersScreen;
