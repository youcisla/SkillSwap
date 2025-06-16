import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Paragraph,
    Text,
    TextInput,
    Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { completeSession } from '../../store/slices/sessionSlice';
import { RootStackParamList } from '../../types';

type FeedbackScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Feedback'>;
type FeedbackScreenRouteProp = RouteProp<RootStackParamList, 'Feedback'>;

interface Props {
  navigation: FeedbackScreenNavigationProp;
  route: FeedbackScreenRouteProp;
}

const FeedbackScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { currentSession } = useAppSelector((state) => state.sessions);
  
  const { sessionId, otherUserName } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await dispatch(completeSession({
        sessionId,
        feedback: {
          rating,
          comment: comment.trim()
        }
      })).unwrap();

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Session Feedback</Title>
            <Paragraph style={styles.description}>
              How was your session with {otherUserName}? Your feedback helps improve the SkillSwap community.
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Rate Your Experience</Title>
            <View style={styles.ratingContainer}>
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starButton}
                    onPress={() => setRating(star)}
                  >
                    <Text style={[
                      styles.star,
                      star <= rating && styles.filledStar
                    ]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {rating === 0 ? 'Tap to rate' : 
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Fair' :
                 rating === 3 ? 'Good' :
                 rating === 4 ? 'Very Good' : 'Excellent'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Additional Comments</Title>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Share your thoughts about the session (optional)..."
              value={comment}
              onChangeText={setComment}
              style={styles.commentInput}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmitFeedback}
          style={styles.submitButton}
          loading={isSubmitting}
          disabled={isSubmitting || rating === 0}
        >
          Submit Feedback
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.skipButton}
          disabled={isSubmitting}
        >
          Skip for Now
        </Button>
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
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    color: '#6200ea',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  star: {
    fontSize: 30,
    color: '#ddd',
  },
  filledStar: {
    color: '#ffc107',
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  commentInput: {
    marginBottom: 8,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  skipButton: {
    marginBottom: 32,
  },
});

export default FeedbackScreen;
