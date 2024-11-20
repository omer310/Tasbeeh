import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SplashScreen = ({ isDarkMode }) => {
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
    ]}>
      <Image 
        source={require('../assets/icon4.png')} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 250,
    height: 250,
  }
});

export default SplashScreen; 