import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Settings = ({ darkMode, toggleDarkMode, theme, changeTheme, themeColors, selectedFont, changeFont, language, changeLanguage }) => {
  const fontOptions = ['Scheherazade', 'Amiri', 'Lateef'];
  const languageOptions = [
    { label: 'العربية', value: 'ar' },
    { label: 'English', value: 'en' },
  ];

  const renderSettingItem = (label, component, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLabelContainer}>
        <Icon name={icon} size={24} color={themeColors.primary} style={styles.settingIcon} />
        <Text style={[styles.settingLabel, { color: themeColors.textColor }]}>{label}</Text>
      </View>
      {component}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <Text style={[styles.title, { color: themeColors.textColor }]}>
        {language === 'ar' ? 'الإعدادات' : 'Settings'}
      </Text>
      
      <View style={styles.card}>
        {renderSettingItem(language === 'ar' ? 'الوضع الداكن' : 'Dark Mode', 
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#767577", true: themeColors.primary }}
            thumbColor={darkMode ? themeColors.accent : "#f4f3f4"}
          />,
          'brightness-6'
        )}

        {renderSettingItem(language === 'ar' ? 'السمة' : 'Theme',
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={theme}
              style={[styles.picker, { color: themeColors.textColor }]}
              onValueChange={(itemValue) => changeTheme(itemValue)}
            >
              <Picker.Item label={language === 'ar' ? 'افتراضي' : 'Default'} value="default" />
              <Picker.Item label={language === 'ar' ? 'طبيعة' : 'Nature'} value="nature" />
              <Picker.Item label={language === 'ar' ? 'محيط' : 'Ocean'} value="ocean" />
            </Picker>
          </View>,
          'palette'
        )}

        {renderSettingItem(language === 'ar' ? 'الخط العربي' : 'Arabic Font',
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedFont}
              style={[styles.picker, { color: themeColors.textColor }]}
              onValueChange={(itemValue) => changeFont(itemValue)}
            >
              {fontOptions.map((font) => (
                <Picker.Item key={font} label={font} value={font} />
              ))}
            </Picker>
          </View>,
          'font-download'
        )}

        {renderSettingItem(language === 'ar' ? 'اللغة' : 'Language',
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              style={[styles.picker, { color: themeColors.textColor }]}
              onValueChange={(itemValue) => changeLanguage(itemValue)}
            >
              {languageOptions.map((lang) => (
                <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
              ))}
            </Picker>
          </View>,
          'language'
        )}
      </View>

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: themeColors.primary }]}
        onPress={() => {/* Implement reset functionality */}}
      >
        <Icon name="refresh" size={24} color={themeColors.backgroundColor} />
        <Text style={[styles.resetButtonText, { color: themeColors.backgroundColor }]}>
          {language === 'ar' ? 'إعادة التعيين إلى الافتراضي' : 'Reset to Default'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: 150,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});

export default Settings;