import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
];

const CustomColorPicker = ({ onColorSelected, currentColor, usedColors = [] }) => {
  return (
    <View style={styles.container}>
      {colors.map((color) => {
        const isUsed = usedColors.includes(color) && color !== currentColor;
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton, 
              { backgroundColor: color },
              isUsed && styles.usedColor
            ]}
            onPress={() => !isUsed && onColorSelected(color)}
            disabled={isUsed}
          >
            {color === currentColor && (
              <Ionicons name="checkmark" size={24} color="white" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedColor: {
    opacity: 0.3,
  },
});

export default CustomColorPicker;