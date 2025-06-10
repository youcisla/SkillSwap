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
import { searchUsers } from '../store/slices/userSlice';
import { RootStackParamList, UserProfile } from '../types';

type UserListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserList'>;
type UserListScreenRouteProp = RouteProp<RootStackParamList, 'UserList'>;

interface Props {
  navigation: UserListScreenNavigationProp;
  route: UserListScreenRouteProp;
}

const UserListScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users, loading } = useAppSelector((state) => state.user);
  const { currentUser } = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const initialSkillId = route.params?.skillId;

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filterType]);

  useEffect(() => {
    if (initialSkillId) {
      setSearchQuery(initialSkillId);
    }
  }, [initialSkillId]);

  const loadUsers = async () => {
    try {
      const filters: any = {};
      
      if (currentUser?.city) {
        filters.city = currentUser.city;
      }

      if (filterType === 'teachers' && currentUser?.skillsToLearn) {
        filters.skillsToTeach = currentUser.skillsToLearn.map(skill => skill.name);
      } else if (filterType === 'students' && currentUser?.skillsToTeach) {
        filters.skillsToLearn = currentUser.skillsToTeach.map(skill => skill.name);
      }

      await dispatch(searchUsers({ query: searchQuery, filters })).unwrap();
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

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
    .sort((a, b) => getCompatibilityScore(b) - getCompatibilityScore(a)); // Sort by compatibility

  const renderUserItem = ({ item: userProfile }: { item: UserProfile }) => {
    const compatibilityScore = getCompatibilityScore(userProfile);
    
    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <Avatar.Image 
              size={50} 
              source={{ uri: userProfile.profileImage || 'https://via.placeholder.com/50' }}
            />
            <View style={styles.userInfo}>
              <Title>{userProfile.name}</Title>
              <Paragraph>{userProfile.city}</Paragraph>
              {userProfile.rating && (
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
                {userProfile.skillsToTeach.length > 3 && (
                  <Text style={styles.moreSkills}>
                    +{userProfile.skillsToTeach.length - 3} more
                  </Text>
                )}
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
                {userProfile.skillsToLearn.length > 3 && (
                  <Text style={styles.moreSkills}>
                    +{userProfile.skillsToLearn.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile', { userId: userProfile.id })}
              style={styles.actionButton}
            >
              View Profile
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Chat', { 
                chatId: `${user?.id}-${userProfile.id}`, 
                otherUserId: userProfile.id 
              })}
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
      <Text style={styles.emptyStateTitle}>No users found</Text>
      <Paragraph style={styles.emptyStateText}>
        Try adjusting your search or filters to find more users.
      </Paragraph>
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
            { value: 'teachers', label: 'Can Teach Me' },
            { value: 'students', label: 'Want to Learn' },
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
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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
