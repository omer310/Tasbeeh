import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4CAF50',
  background: '#f0f0f0',
  card: '#ffffff',
  text: '#333333',
  border: '#cccccc',
  error: '#ff0000',
  white: '#ffffff',
};

export const globalStyles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
});