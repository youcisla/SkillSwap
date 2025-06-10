import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {
    Card,
    Chip,
    FAB,
    Searchbar,
    Text,
    Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList, SkillCategory, SkillLevel } from '../../types';

type AddSkillScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddSkill'>;
type AddSkillScreenRouteProp = RouteProp<RootStackParamList, 'AddSkill'>;

interface Props {
  navigation: AddSkillScreenNavigationProp;
  route: AddSkillScreenRouteProp;
}

const AddSkillScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.skills);

  const skillType = route.params?.type || 'teach';
  
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(SkillCategory.OTHER);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>(SkillLevel.BEGINNER);
  const [searchQuery, setSearchQuery] = useState('');

  // Popular skills by category
  const popularSkills = {
    [SkillCategory.TECHNOLOGY]: ['JavaScript', 'Python', 'React', 'Node.js', 'Mobile Development'],
    [SkillCategory.MUSIC]: ['Guitar', 'Piano', 'Singing', 'Drums', 'Music Production'],
    [SkillCategory.COOKING]: ['Baking', 'French Cuisine', 'Asian Cooking', 'Healthy Cooking', 'Pastry'],
    [SkillCategory.SPORTS]: ['Yoga', 'Running', 'Swimming', 'Tennis', 'Basketball'],
    [SkillCategory.LANGUAGES]: ['English', 'Spanish', 'French', 'Mandarin', 'Arabic'],
    [SkillCategory.ARTS]: ['Drawing', 'Painting', 'Photography', 'Digital Art', 'Sculpture'],
    [SkillCategory.OTHER]: ['Public Speaking', 'Writing', 'Leadership', 'Time Management'],
  };

  const filteredSkills = popularSkills[selectedCategory].filter(skill =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSkill = async () => {
    if (!selectedSkill || !user?.id) return;

    try {
      // In a real app, you'd dispatch an action to add the skill
      console.log('Adding skill:', {
        userId: user.id,
        skill: {
          name: selectedSkill,
          category: selectedCategory,
          level: selectedLevel,
          description: '',
        },
        type: skillType,
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add skill:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>
              Add Skill to {skillType === 'teach' ? 'Teach' : 'Learn'}
            </Title>
            
            <Text style={styles.sectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {Object.values(SkillCategory).map((category) => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.categoryChip}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Search Skills</Text>
            <Searchbar
              placeholder="Search for skills..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            <Text style={styles.sectionTitle}>Popular Skills</Text>
            <View style={styles.skillsContainer}>
              {filteredSkills.map((skill) => (
                <Chip
                  key={skill}
                  selected={selectedSkill === skill}
                  onPress={() => setSelectedSkill(skill)}
                  style={styles.skillChip}
                >
                  {skill}
                </Chip>
              ))}
            </View>

            {skillType === 'teach' && (
              <>
                <Text style={styles.sectionTitle}>Your Level</Text>
                <View style={styles.levelContainer}>
                  {Object.values(SkillLevel).map((level) => (
                    <Chip
                      key={level}
                      selected={selectedLevel === level}
                      onPress={() => setSelectedLevel(level)}
                      style={styles.levelChip}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </View>

      <FAB
        style={styles.fab}
        icon="check"
        label="Add Skill"
        onPress={handleAddSkill}
        disabled={!selectedSkill || loading}
      />
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
    paddingBottom: 80,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6200ea',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  searchbar: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    margin: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  levelChip: {
    margin: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AddSkillScreen;
