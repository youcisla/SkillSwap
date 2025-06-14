import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    DataTable,
    IconButton,
    List,
    Modal,
    Paragraph,
    Portal,
    Surface,
    Switch,
    Text,
    TextInput,
    Title,
} from 'react-native-paper';
import { AdminSession, AdminSkill, AdminUser } from '../../services/adminService';
import { useAppDispatch, useAppSelector } from '../../store';
import {
    deleteSkill,
    deleteUser,
    fetchAnalytics,
    fetchDashboard,
    fetchSessions,
    fetchSkills,
    fetchUsers,
    updateSkill,
    updateUser
} from '../../store/slices/adminSlice';
import ContentModerationScreen from './ContentModerationScreen';
import SystemSettingsScreen from './SystemSettingsScreen';

type TabType = 'dashboard' | 'users' | 'skills' | 'sessions' | 'analytics' | 'moderation' | 'settings';

const AdminDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { dashboard, users, skills, sessions, analytics, loading, error } = useAppSelector(
    (state) => state.admin
  );
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'skill' | 'session' | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminUser | AdminSkill | AdminSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState<any>({}); // For storing form data

  // Check if user has admin access
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      return;
    }

    loadInitialData();
  }, [isAdmin]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboard()),
        dispatch(fetchUsers({ page: 1, limit: 10 })),
        dispatch(fetchSkills({ page: 1, limit: 10 })),
        dispatch(fetchSessions({ page: 1, limit: 10 })),
        dispatch(fetchAnalytics('30d')),
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await dispatch(updateUser({ userId, updates }));
      await dispatch(fetchUsers({ page: 1, limit: 10 })); // Refresh users list
      Alert.alert('Success', 'User updated successfully');
      setModalVisible(false);
      setEditForm({});
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleUpdateSkill = async (skillId: string, updates: any) => {
    try {
      await dispatch(updateSkill({ skillId, updates }));
      await dispatch(fetchSkills({ page: 1, limit: 10 })); // Refresh skills list
      Alert.alert('Success', 'Skill updated successfully');
      setModalVisible(false);
      setEditForm({});
    } catch (error) {
      Alert.alert('Error', 'Failed to update skill');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to deactivate this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteUser(userId));
              Alert.alert('Success', 'User deactivated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate user');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (type: 'user' | 'skill' | 'session', item: any) => {
    setModalType(type);
    setSelectedItem(item);
    
    // Initialize form with current values
    if (type === 'user') {
      setEditForm({
        name: item.name,
        email: item.email,
        city: item.city,
        role: item.role,
        isActive: item.isActive,
      });
    } else if (type === 'skill') {
      setEditForm({
        name: item.name,
        category: item.category,
        level: item.level,
        description: item.description,
        isActive: item.isActive,
      });
    }
    
    setModalVisible(true);
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{dashboard?.statistics.users.total}</Title>
          <Paragraph style={styles.statLabel}>Total Users</Paragraph>
          <Paragraph style={styles.statSubtext}>
            {dashboard?.statistics.users.active} active
          </Paragraph>
        </Surface>

        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{dashboard?.statistics.skills.total}</Title>
          <Paragraph style={styles.statLabel}>Skills</Paragraph>
          <Paragraph style={styles.statSubtext}>
            {dashboard?.statistics.skills.active} active
          </Paragraph>
        </Surface>

        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{dashboard?.statistics.sessions.total}</Title>
          <Paragraph style={styles.statLabel}>Sessions</Paragraph>
          <Paragraph style={styles.statSubtext}>
            {dashboard?.statistics.sessions.completed} completed
          </Paragraph>
        </Surface>

        <Surface style={styles.statCard}>
          <Title style={styles.statNumber}>{dashboard?.statistics.matches.total}</Title>
          <Paragraph style={styles.statLabel}>Matches</Paragraph>
          <Paragraph style={styles.statSubtext}>
            {dashboard?.statistics.matches.active} active
          </Paragraph>
        </Surface>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Users</Title>
          {dashboard?.recentUsers.map((user) => (
            <List.Item
              key={user.id}
              title={user.name}
              description={`${user.email} • ${user.city}`}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={() => (
                <Chip icon={user.isActive ? 'check' : 'close'} compact>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Chip>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Top Skills</Title>
          {dashboard?.topSkills.slice(0, 5).map((skill, index) => (
            <List.Item
              key={skill._id}
              title={skill._id}
              description={`${skill.count} users`}
              left={(props) => <List.Icon {...props} icon="star" />}
              right={() => <Paragraph>#{index + 1}</Paragraph>}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TextInput
          mode="outlined"
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
        <Button
          mode="contained"
          onPress={() => dispatch(fetchUsers({ search: searchQuery, page: 1 }))}
          style={styles.searchButton}
        >
          Search
        </Button>
      </View>

      <ScrollView>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Email</DataTable.Title>
            <DataTable.Title>Role</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {users.data.map((user) => (
            <DataTable.Row key={user.id}>
              <DataTable.Cell>{user.name}</DataTable.Cell>
              <DataTable.Cell>{user.email}</DataTable.Cell>
              <DataTable.Cell>
                <Chip compact>{user.role}</Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip 
                  icon={user.isActive ? 'check' : 'close'} 
                  compact
                  style={{ backgroundColor: user.isActive ? '#e8f5e8' : '#ffeaea' }}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => openEditModal('user', user)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDeleteUser(user.id)}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        {users.loading && <ActivityIndicator style={styles.loader} />}
      </ScrollView>
    </View>
  );

  const renderSkills = () => (
    <View style={styles.tabContent}>
      <View style={styles.header}>
        <TextInput
          mode="outlined"
          placeholder="Search skills..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
        <Button
          mode="contained"
          onPress={() => dispatch(fetchSkills({ search: searchQuery, page: 1 }))}
          style={styles.searchButton}
        >
          Search
        </Button>
      </View>

      <ScrollView>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Category</DataTable.Title>
            <DataTable.Title>Type</DataTable.Title>
            <DataTable.Title>User</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {skills.data.map((skill) => (
            <DataTable.Row key={skill.id}>
              <DataTable.Cell>{skill.name}</DataTable.Cell>
              <DataTable.Cell>
                <Chip compact>{skill.category}</Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip compact>{skill.type}</Chip>
              </DataTable.Cell>
              <DataTable.Cell>{skill.userId.name}</DataTable.Cell>
              <DataTable.Cell>
                <Chip 
                  icon={skill.isActive ? 'check' : 'close'} 
                  compact
                  style={{ backgroundColor: skill.isActive ? '#e8f5e8' : '#ffeaea' }}
                >
                  {skill.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => openEditModal('skill', skill)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => dispatch(deleteSkill(skill.id))}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        {skills.loading && <ActivityIndicator style={styles.loader} />}
      </ScrollView>
    </View>
  );

  const renderSessions = () => (
    <View style={styles.tabContent}>
      <ScrollView>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Teacher</DataTable.Title>
            <DataTable.Title>Student</DataTable.Title>
            <DataTable.Title>Skill</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {sessions.data.map((session) => (
            <DataTable.Row key={session.id}>
              <DataTable.Cell>{session.teacherId.name}</DataTable.Cell>
              <DataTable.Cell>{session.studentId.name}</DataTable.Cell>
              <DataTable.Cell>{session.skillId.name}</DataTable.Cell>
              <DataTable.Cell>
                {new Date(session.scheduledAt).toLocaleDateString()}
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip compact>{session.status}</Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => openEditModal('session', session)}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        {sessions.loading && <ActivityIndicator style={styles.loader} />}
      </ScrollView>
    </View>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent}>
      {analytics && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Title>User Growth (Last 30 Days)</Title>
              <Text>Total new users: {analytics.userGrowth.reduce((sum, item) => sum + item.count, 0)}</Text>
              {analytics.userGrowth.slice(-5).map((item) => (
                <List.Item
                  key={item._id}
                  title={new Date(item._id).toLocaleDateString()}
                  description={`${item.count} new users`}
                  left={(props) => <List.Icon {...props} icon="account-plus" />}
                />
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Skill Categories Distribution</Title>
              {analytics.skillDistribution.slice(0, 6).map((item, index) => (
                <List.Item
                  key={item._id}
                  title={item._id}
                  description={`${item.count} skills`}
                  left={(props) => <List.Icon {...props} icon="star" />}
                  right={() => <Text>{Math.round((item.count / analytics.skillDistribution.reduce((sum, s) => sum + s.count, 0)) * 100)}%</Text>}
                />
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Session Statistics</Title>
              {analytics.sessionStats.map((item) => (
                <List.Item
                  key={item._id}
                  title={item._id}
                  description={`${item.count} sessions`}
                  left={(props) => <List.Icon {...props} icon="calendar" />}
                />
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Engagement Metrics</Title>
              <List.Item
                title="Active Users (7 days)"
                description={`${analytics.engagementMetrics.activeUsers} users`}
                left={(props) => <List.Icon {...props} icon="account-group" />}
              />
              <List.Item
                title="Messages This Week"
                description={`${analytics.engagementMetrics.messagesThisWeek} messages`}
                left={(props) => <List.Icon {...props} icon="message-text" />}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Top Users by Sessions</Title>
              {analytics.topUsers.map((user, index) => (
                <List.Item
                  key={user.id}
                  title={user.name}
                  description={`${user.totalSessions} sessions • Rating: ${user.rating}/5`}
                  left={(props) => <List.Icon {...props} icon="crown" />}
                  right={() => <Text>#{index + 1}</Text>}
                />
              ))}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );

  const renderTabBar = () => (
    <Surface style={styles.tabBar}>
      {      [
        { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
        { key: 'users', label: 'Users', icon: 'account-group' },
        { key: 'skills', label: 'Skills', icon: 'school' },
        { key: 'sessions', label: 'Sessions', icon: 'calendar' },
        { key: 'analytics', label: 'Analytics', icon: 'chart-line' },
        { key: 'moderation', label: 'Moderation', icon: 'shield-check' },
        { key: 'settings', label: 'Settings', icon: 'cog' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab(tab.key as TabType)}
        >
          <IconButton
            icon={tab.icon}
            size={24}
            iconColor={activeTab === tab.key ? '#6200ea' : '#666'}
          />
          <Paragraph style={[
            styles.tabLabel,
            activeTab === tab.key && styles.activeTabLabel,
          ]}>
            {tab.label}
          </Paragraph>
        </TouchableOpacity>
      ))}
    </Surface>
  );

  if (!isAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Title>Access Denied</Title>
        <Paragraph>You do not have admin privileges.</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'skills' && renderSkills()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'moderation' && <ContentModerationScreen />}
        {activeTab === 'settings' && <SystemSettingsScreen />}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setEditForm({});
          }}
          contentContainerStyle={styles.modal}
        >
          <Title>Edit {modalType}</Title>
          
          {modalType === 'user' && selectedItem && (
            <ScrollView style={styles.modalContent}>
              <TextInput
                label="Name"
                value={editForm.name || ''}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Email"
                value={editForm.email || ''}
                onChangeText={(text) => setEditForm({...editForm, email: text})}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="City"
                value={editForm.city || ''}
                onChangeText={(text) => setEditForm({...editForm, city: text})}
                style={styles.input}
                mode="outlined"
              />
              
              <View style={styles.switchContainer}>
                <Text>Active Status</Text>
                <Switch
                  value={editForm.isActive}
                  onValueChange={(value) => setEditForm({...editForm, isActive: value})}
                />
              </View>
              
              <Text style={styles.label}>Role</Text>
              <View style={styles.chipContainer}>
                {['user', 'admin', 'super-admin'].map((role) => (
                  <Chip
                    key={role}
                    selected={editForm.role === role}
                    onPress={() => setEditForm({...editForm, role})}
                    style={styles.roleChip}
                  >
                    {role}
                  </Chip>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    setEditForm({});
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleUpdateUser((selectedItem as AdminUser).id, editForm)}
                  style={styles.modalButton}
                >
                  Save
                </Button>
              </View>
            </ScrollView>
          )}
          
          {modalType === 'skill' && selectedItem && (
            <ScrollView style={styles.modalContent}>
              <TextInput
                label="Skill Name"
                value={editForm.name || ''}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                style={styles.input}
                mode="outlined"
              />
              
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipContainer}>
                {['technology', 'music', 'cooking', 'sports', 'languages', 'arts', 'other'].map((category) => (
                  <Chip
                    key={category}
                    selected={editForm.category === category}
                    onPress={() => setEditForm({...editForm, category})}
                    style={styles.categoryChip}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
              
              <Text style={styles.label}>Level</Text>
              <View style={styles.chipContainer}>
                {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                  <Chip
                    key={level}
                    selected={editForm.level === level}
                    onPress={() => setEditForm({...editForm, level})}
                    style={styles.levelChip}
                  >
                    {level}
                  </Chip>
                ))}
              </View>
              
              <TextInput
                label="Description"
                value={editForm.description || ''}
                onChangeText={(text) => setEditForm({...editForm, description: text})}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.switchContainer}>
                <Text>Active Status</Text>
                <Switch
                  value={editForm.isActive}
                  onValueChange={(value) => setEditForm({...editForm, isActive: value})}
                />
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    setEditForm({});
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleUpdateSkill((selectedItem as AdminSkill).id, editForm)}
                  style={styles.modalButton}
                >
                  Save
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    backgroundColor: '#e8f4fd',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#6200ea',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    alignSelf: 'flex-end',
  },
  loader: {
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    maxHeight: 400,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  roleChip: {
    margin: 4,
  },
  categoryChip: {
    margin: 4,
  },
  levelChip: {
    margin: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    minWidth: 100,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default AdminDashboardScreen;
