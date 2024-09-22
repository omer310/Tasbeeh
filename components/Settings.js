import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const Settings = ({ darkMode, toggleDarkMode, theme, changeTheme, themeColors, selectedFont, changeFont }) => {
  const fontOptions = ['Scheherazade', 'Amiri', 'Lateef']; // Add more fonts as needed

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <Text style={[styles.title, { color: themeColors.textColor }]}>Settings</Text>
      
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Theme</Text>
        <Picker
          selectedValue={theme}
          style={[styles.picker, { color: themeColors.textColor }]}
          onValueChange={(itemValue) => changeTheme(itemValue)}
        >
          <Picker.Item label="Default" value="default" />
          <Picker.Item label="Nature" value="nature" />
          <Picker.Item label="Ocean" value="ocean" />
        </Picker>
      </View>

      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>Arabic Font</Text>
        <Picker
          selectedValue={selectedFont}
          style={[styles.picker, { color: themeColors.textColor }]}
          onValueChange={(itemValue) => changeFont(itemValue)}
        >
          {fontOptions.map((font) => (
            <Picker.Item key={font} label={font} value={font} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 16,
  },
  themeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  themeButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: 150,
  },
});

export default Settings;