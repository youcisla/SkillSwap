import React from 'react';
import { Avatar } from 'react-native-paper';

interface SafeAvatarProps {
  size: number;
  source?: { uri: string };
  fallbackText?: string;
  style?: any;
}

const SafeAvatar: React.FC<SafeAvatarProps> = ({ 
  size, 
  source, 
  fallbackText = 'U',
  style 
}) => {
  // If we have a valid image source, use Avatar.Image
  if (source?.uri && source.uri.length > 0 && !source.uri.startsWith('data:image/svg+xml')) {
    return <Avatar.Image size={size} source={source} style={style} />;
  }
  
  // Otherwise, use Avatar.Text with the first letter
  const initials = fallbackText.charAt(0).toUpperCase();
  
  return (
    <Avatar.Text 
      size={size} 
      label={initials} 
      style={[{ backgroundColor: '#6200ea' }, style]} 
    />
  );
};

export default SafeAvatar;
