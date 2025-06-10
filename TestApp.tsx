import React from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

export default function TestApp() {
  const handlePress = () => {
    Alert.alert('Success!', 'React Native UI is working!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SkillSwap Test Screen</Text>
      <Text style={styles.subtitle}>If you can see this, React Native is working!</Text>
      <Button title="Test Button" onPress={handlePress} />
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>✅ React Native is loaded</Text>
        <Text style={styles.infoText}>✅ Components are rendering</Text>
        <Text style={styles.infoText}>✅ Styles are working</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 10,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  infoText: {
    fontSize: 16,
    color: '#2e7d32',
    marginBottom: 5,
  },
});
