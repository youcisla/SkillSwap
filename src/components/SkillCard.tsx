import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card, Chip, IconButton, Menu, Paragraph, Title } from 'react-native-paper';
import { Skill, SkillLevel } from '../types';

interface SkillCardProps {
  skill: Skill;
  type: 'teach' | 'learn';
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  type,
  onEdit,
  onDelete,
  style
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const getLevelColor = (level: SkillLevel): string => {
    switch (level) {
      case SkillLevel.BEGINNER:
        return '#4caf50';
      case SkillLevel.INTERMEDIATE:
        return '#ff9800';
      case SkillLevel.ADVANCED:
        return '#f44336';
      case SkillLevel.EXPERT:
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      technology: '#2196f3',
      music: '#e91e63',
      cooking: '#ff5722',
      sports: '#4caf50',
      languages: '#9c27b0',
      arts: '#ff9800',
      other: '#607d8b',
    };
    return colors[category] || colors.other;
  };

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.skillName}>{skill.name}</Title>
            <View style={styles.chips}>
              <Chip
                style={[styles.typeChip, { backgroundColor: type === 'teach' ? '#e8f5e8' : '#e3f2fd' }]}
                textStyle={[styles.typeChipText, { color: type === 'teach' ? '#2e7d32' : '#1976d2' }]}
                compact
              >
                {type === 'teach' ? 'Teaching' : 'Learning'}
              </Chip>
              <Chip
                style={[styles.levelChip, { backgroundColor: getLevelColor(skill.level) + '20' }]}
                textStyle={[styles.levelChipText, { color: getLevelColor(skill.level) }]}
                compact
              >
                {skill.level}
              </Chip>
            </View>
          </View>
          
          {(onEdit || onDelete) && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              {onEdit && (
                <Menu.Item
                  onPress={() => {
                    onEdit();
                    setMenuVisible(false);
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
              )}
              {onDelete && (
                <Menu.Item
                  onPress={() => {
                    onDelete();
                    setMenuVisible(false);
                  }}
                  title="Delete"
                  leadingIcon="delete"
                />
              )}
            </Menu>
          )}
        </View>

        <View style={styles.categoryContainer}>
          <Chip
            style={[styles.categoryChip, { backgroundColor: getCategoryColor(skill.category) + '20' }]}
            textStyle={[styles.categoryChipText, { color: getCategoryColor(skill.category) }]}
            icon="tag"
            compact
          >
            {skill.category}
          </Chip>
        </View>

        {skill.description && (
          <Paragraph style={styles.description} numberOfLines={3}>
            {skill.description}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  levelChip: {
    height: 24,
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryChip: {
    height: 28,
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
});

export default SkillCard;
