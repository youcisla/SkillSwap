import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Snackbar,
    Text,
    TextInput,
    Title
} from 'react-native-paper';
import SafeAvatar from '../../components/SafeAvatar';
import { userService } from '../../services/userService';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateUserProfile } from '../../store/slices/userSlice';
import { ProfileForm, RootStackParamList } from '../../types';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;
type EditProfileScreenRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
  route: EditProfileScreenRouteProp;
}

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, loading } = useAppSelector((state) => state.user);
  
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    city: '',
    bio: '',
    profileImage: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name,
        city: currentUser.city,
        bio: currentUser.bio || '',
        profileImage: currentUser.profileImage || '',
      });
      setProfileImage(currentUser.profileImage || null);
    }
  }, [currentUser]);

  const handleInputChange = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setSnackbarMessage('Failed to pick image');
      setSnackbarVisible(true);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to take your profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setSnackbarMessage('Failed to take photo');
      setSnackbarVisible(true);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!form.name.trim() || !form.city.trim()) {
      setSnackbarMessage('Name and city are required');
      setSnackbarVisible(true);
      return;
    }

    try {
      // First, upload the profile image if it was changed
      let updatedForm = { ...form };
      if (profileImage && profileImage !== currentUser?.profileImage) {
        try {
          const imageUrl = await userService.uploadProfileImage(user.id, profileImage);
          updatedForm = { ...form, profileImage: imageUrl };
        } catch (imageError) {
          console.error('Failed to upload profile image:', imageError);
          setSnackbarMessage('Failed to upload profile image');
          setSnackbarVisible(true);
          return;
        }
      }

      // Then update the profile with all data including the new image URL
      await dispatch(updateUserProfile({ 
        userId: user.id, 
        data: updatedForm 
      })).unwrap();
      
      setSnackbarMessage('Profile updated successfully');
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSnackbarMessage('Failed to update profile');
      setSnackbarVisible(true);
    }
  };

  const isFormValid = form.name.trim().length > 0 && form.city.trim().length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Edit Profile</Title>

            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <SafeAvatar 
                    size={120} 
                    source={currentUser?.profileImage ? { uri: currentUser.profileImage } : undefined}
                    fallbackText={currentUser?.name || 'U'}
                    style={styles.avatar} 
                  />
                )}
                <View style={styles.cameraIconContainer}>
                  <Avatar.Icon size={32} icon="camera" style={styles.cameraIcon} />
                </View>
              </TouchableOpacity>
              <Text style={styles.imageHint}>Tap to change photo</Text>
            </View>

            <TextInput
              label="Full Name *"
              value={form.name}
              onChangeText={(text) => handleInputChange('name', text)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="City *"
              value={form.city}
              onChangeText={(text) => handleInputChange('city', text)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Bio"
              value={form.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Tell others about yourself, your interests, and what skills you'd like to share or learn..."
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={!isFormValid || loading}
              style={styles.button}
            >
              Save Changes
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6200ea',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ea',
    borderRadius: 16,
  },
  cameraIcon: {
    backgroundColor: '#6200ea',
  },
  imageHint: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
});

export default EditProfileScreen;
