import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
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
    IconButton,
    Paragraph,
    Text,
    Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList, Skill } from '../../types';

type SkillManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SkillManagement'>;

interface Props {
  navigation: SkillManagementScreenNavigationProp;
}

const SkillManagementScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { skills, loading } = useAppSelector((state) => state.skills);

  // Mock skills data for demo
  const [teachSkills] = useState<Skill[]>([
    {
      id: '1',
      name: 'JavaScript',
      category: 'technology',
      level: 'advanced',
      description: 'Web development with modern frameworks',
    },
    {
      id: '2',
      name: 'Guitar',
      category: 'music',
      level: 'intermediate',
      description: 'Acoustic and electric guitar',
    },
  ]);

  const [learnSkills] = useState<Skill[]>([
    {
      id: '3',
      name: 'Spanish',
      category: 'languages',
      level: 'beginner',
      description: 'Conversational Spanish',
    },
    {
      id: '4',
      name: 'Photography',
      category: 'arts',
      level: 'beginner',
      description: 'Portrait and landscape photography',
    },
  ]);

  const handleDeleteSkill = (skillId: string, skillName: string) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to remove "${skillName}" from your skills?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, dispatch delete action
            console.log('Deleting skill:', skillId);
          },
        },
      ]
    );
  };

  const renderSkillCard = (skill: Skill, type: 'teach' | 'learn') => (
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Skills to Teach */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Skills I Can Teach</Title>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('AddSkill', { type: 'teach' })}
                compact
              >
                Add
              </Button>
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
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('AddSkill', { type: 'learn' })}
                compact
              >
                Add
              </Button>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default SkillManagementScreen;
