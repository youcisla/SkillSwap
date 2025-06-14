import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    Divider,
    FAB,
    IconButton,
    Paragraph,
    Text,
    Title
} from 'react-native-paper';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../../components/ui/MultiSelection';
import { useMultiSelection } from '../../hooks/useMultiSelection';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchUserSkills, removeSkill } from '../../store/slices/skillSlice';
import { RootStackParamList, Skill } from '../../types';

type SkillManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SkillManagement'>;

interface Props {
  navigation: SkillManagementScreenNavigationProp;
}

const SkillManagementScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { skills, loading } = useAppSelector((state) => state.skills);
  
  // Multi-selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'teach' | 'learn' | null>(null);

  // Multi-selection hooks for different skill types
  const teachSelection = useMultiSelection<Skill>(
    (skill) => skill.id,
    { allowSelectAll: true }
  );

  const learnSelection = useMultiSelection<Skill>(
    (skill) => skill.id,
    { allowSelectAll: true }
  );  // Fetch user skills when component mounts or when returning from other screens
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('🔄 Fetching user skills on focus...');
        dispatch(fetchUserSkills(user.id));
      }
    }, [dispatch, user?.id])
  );

  // Separate skills into teach and learn categories
  const teachSkills = useMemo(() => {
    console.log('🔍 All skills for filtering:', skills.map(s => ({ name: s.name, type: s.type, id: s.id })));
    const filtered = skills.filter(skill => skill.type === 'teach');
    console.log('📚 Teaching skills:', filtered.length, filtered.map(s => ({ name: s.name, type: s.type })));
    return filtered;
  }, [skills]);
  
  const learnSkills = useMemo(() => {
    const filtered = skills.filter(skill => skill.type === 'learn');
    console.log('🎯 Learning skills:', filtered.length, filtered.map(s => ({ name: s.name, type: s.type })));
    return filtered;
  }, [skills]);

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to remove "${skillName}" from your skills?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeSkill(skillId)).unwrap();
            } catch (error) {
              console.error('Failed to delete skill:', error);
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = async (skillType: 'teach' | 'learn') => {
    const selection = skillType === 'teach' ? teachSelection : learnSelection;
    const selectedSkills = skills.filter(s => s.type === skillType && selection.isSelected(s));
    
    if (selectedSkills.length === 0) return;

    Alert.alert(
      'Delete Skills',
      `Are you sure you want to remove ${selectedSkills.length} skill${selectedSkills.length === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedSkills.map(skill => dispatch(removeSkill(skill.id)).unwrap())
              );
              selection.deselectAll();
              setIsSelectionMode(false);
              setActiveSection(null);
            } catch (error) {
              console.error('Failed to delete skills:', error);
            }
          },
        },
      ]
    );
  };

  const handleStartSelection = (section: 'teach' | 'learn') => {
    setIsSelectionMode(true);
    setActiveSection(section);
  };

  const handleCancelSelection = () => {
    teachSelection.deselectAll();
    learnSelection.deselectAll();
    setIsSelectionMode(false);
    setActiveSection(null);
  };

  const getCurrentSelection = () => {
    if (activeSection === 'teach') return teachSelection;
    if (activeSection === 'learn') return learnSelection;
    return null;
  };

  const getCurrentSkills = () => {
    if (activeSection === 'teach') return teachSkills;
    if (activeSection === 'learn') return learnSkills;
    return [];
  };

  const renderSkillCard = (skill: Skill, type: 'teach' | 'learn') => {
    const selection = type === 'teach' ? teachSelection : learnSelection;
    const isCurrentSection = activeSection === type;
    
    if (isSelectionMode && isCurrentSection) {
      return (
        <SelectableItem
          key={skill.id}
          isSelected={selection.isSelected(skill)}
          onToggleSelection={() => selection.toggleSelection(skill)}
          style={styles.skillCard}
        >
          <View style={styles.skillInfo}>
            <Title style={styles.skillName}>{skill.name}</Title>
            <View style={styles.skillMeta}>
              <Chip style={styles.categoryChip} compact>
                {skill.category}
              </Chip>
              <Chip style={styles.levelChip} compact>
                {skill.level}
              </Chip>
            </View>
            {skill.description && (
              <Paragraph style={styles.skillDescription}>
                {skill.description}
              </Paragraph>
            )}
          </View>
        </SelectableItem>
      );
    }

    return (
      <Card key={skill.id} style={styles.skillCard}>
        <Card.Content>
          <View style={styles.skillHeader}>
            <View style={styles.skillInfo}>
              <Title style={styles.skillName}>{skill.name}</Title>
              <View style={styles.skillMeta}>
                <Chip style={styles.categoryChip} compact>
                  {skill.category}
                </Chip>
                <Chip style={styles.levelChip} compact>
                  {skill.level}
                </Chip>
              </View>
              {skill.description && (
                <Paragraph style={styles.skillDescription}>
                  {skill.description}
                </Paragraph>
              )}
            </View>
            <IconButton
              icon="delete"
              iconColor="#f44336"
              onPress={() => handleDeleteSkill(skill.id, skill.name)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selection Header */}
      {isSelectionMode && activeSection && (
        <SelectionHeader
          selectedCount={getCurrentSelection()?.getSelectedCount() || 0}
          totalCount={getCurrentSkills().length}
          onSelectAll={() => getCurrentSelection()?.selectAll(getCurrentSkills())}
          onDeselectAll={() => getCurrentSelection()?.deselectAll()}
          onCancel={handleCancelSelection}
          isAllSelected={getCurrentSelection()?.isAllSelected(getCurrentSkills()) || false}
        />
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Skills to Teach */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Title style={styles.sectionTitle}>Skills I Can Teach</Title>
                <View style={styles.sectionActions}>
                  {!isSelectionMode && teachSkills.length > 0 && (
                    <Button
                      mode="outlined"
                      onPress={() => handleStartSelection('teach')}
                      compact
                      style={styles.actionButton}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('AddSkill', { type: 'teach' })}
                    compact
                  >
                    Add
                  </Button>
                </View>
              </View>
              
              {teachSkills.length > 0 ? (
                teachSkills.map(skill => renderSkillCard(skill, 'teach'))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No teaching skills added yet</Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('AddSkill', { type: 'teach' })}
                    style={styles.emptyButton}
                  >
                    Add Your First Teaching Skill
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Skills to Learn */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Title style={styles.sectionTitle}>Skills I Want to Learn</Title>
                <View style={styles.sectionActions}>
                  {!isSelectionMode && learnSkills.length > 0 && (
                    <Button
                      mode="outlined"
                      onPress={() => handleStartSelection('learn')}
                      compact
                      style={styles.actionButton}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('AddSkill', { type: 'learn' })}
                    compact
                  >
                    Add
                  </Button>
                </View>
              </View>
              
              {learnSkills.length > 0 ? (
                learnSkills.map(skill => renderSkillCard(skill, 'learn'))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No learning skills added yet</Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('AddSkill', { type: 'learn' })}
                    style={styles.emptyButton}
                  >
                    Add Your First Learning Goal
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Bulk Actions Bar */}
      {isSelectionMode && activeSection && (
        <BulkActionsBar
          selectedCount={getCurrentSelection()?.getSelectedCount() || 0}
          actions={[
            {
              id: 'delete',
              title: 'Delete Selected',
              icon: 'delete',
              onPress: () => handleBulkDelete(activeSection),
              destructive: true,
              disabled: (getCurrentSelection()?.getSelectedCount() || 0) === 0,
            },
          ]}
        />
      )}

      {/* FAB for quick add */}
      {!isSelectionMode && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddSkill', { type: 'teach' })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionCard: {
    elevation: 4,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#6200ea',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
  },
  skillCard: {
    marginBottom: 12,
    elevation: 2,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 18,
    marginBottom: 8,
  },
  skillMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#e3f2fd',
  },
  levelChip: {
    backgroundColor: '#f3e5f5',
  },
  skillDescription: {
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default SkillManagementScreen;
