import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, View, TouchableOpacity, ScrollView, I18nManager, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Add this import
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { SafeAreaView, Platform, StatusBar } from 'react-native';
import { Dimensions } from 'react-native';
import TasbeehCounter from './components/TasbeehCounter';
import PrayerTimes from './components/PrayerTimes';
import QiblaDirection from './components/QiblaDirection';
import IslamicCalendar from './components/IslamicCalendar';
import HadithOfTheDay from './components/HadithOfTheDay';
import Settings from './components/Settings';
import QuranReader from './components/QuranReader';
import Duas from './components/Duas';

const Tab = createBottomTabNavigator();
const DuasStack = createStackNavigator(); // Add this line

// Add this function
function DuasStackScreen({ themeColors, language }) {
  return (
    <DuasStack.Navigator screenOptions={{ headerShown: false }}>
      <DuasStack.Screen 
        name="DuasHome" 
        component={Duas} 
        initialParams={{ themeColors, language }} 
      />
      <DuasStack.Screen 
        name="DuaList" 
        component={Duas} 
        initialParams={{ themeColors, language }} 
      />
      <DuasStack.Screen 
        name="DuaDetails" 
        component={Duas} 
        initialParams={{ themeColors, language }} 
      />
    </DuasStack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation, themeColors }) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { backgroundColor: themeColors.tabBarColor }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Reset the stack to initial route when pressing the tab icon
              navigation.reset({
                index: 0,
                routes: [{ name: route.name }],
              });
            } else if (isFocused) {
              // If already on the screen, reset to initial state
              navigation.dispatch({
                ...navigation.navigate(route.name),
                target: state.key,
              });
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              {options.tabBarIcon({ focused: isFocused, color: isFocused ? '#4CAF50' : 'gray', size: 24 })}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ScreenWrapper({ children, style, themeColors }) {
  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        { backgroundColor: themeColors.backgroundColor },
        { paddingBottom: 80 }, // Adjust this value as needed
        style
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="PrayerTimes"
        component={PrayerTimes}
        options={{ tabBarLabel: 'Prayer Times' }}
      />
      <Tab.Screen
        name="TasbeehCounter"
        component={TasbeehCounter}
        options={{ tabBarLabel: 'Tasbeeh Counter' }}
      />
      <Tab.Screen
        name="Duas"
        component={Duas}
        options={{ tabBarLabel: 'Duas' }}
      />
      <Tab.Screen
        name="QiblaDirection"
        component={QiblaDirection}
        options={{ tabBarLabel: 'Qibla Direction' }}
      />
      <Tab.Screen
        name="QuranReader"
        component={QuranReader}
        options={{ tabBarLabel: 'Quran Reader' }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Scheherazade');
  const [language, setLanguage] = useState('ar'); // Default to Arabic

  useEffect(() => {
    loadSettings();
    loadFonts();
    setupLanguage();
  }, []);

  const setupLanguage = async () => {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
      I18nManager.forceRTL(savedLanguage === 'ar');
    }
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    I18nManager.forceRTL(newLanguage === 'ar');
    // In a real app, you'd want to use a more sophisticated method to reload
    // This is just for demonstration purposes
    console.log('App should reload here to apply RTL changes');
  };

  const loadFonts = async () => {
    await Font.loadAsync({
      ...Ionicons.font,
      'Scheherazade': require('./assets/fonts/Scheherazade-Regular.ttf'),
      'Amiri': require('./assets/fonts/Amiri-Regular.ttf'),
      'Lateef': require('./assets/fonts/Lateef-Regular.ttf'),
      // Add more fonts as needed
    });
    setFontsLoaded(true);
  };

  const loadSettings = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedFont = await AsyncStorage.getItem('selectedFont');
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedTheme !== null) setTheme(savedTheme);
      if (savedFont !== null) setSelectedFont(savedFont);
      if (savedLanguage !== null) setLanguage(savedLanguage);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const changeFont = async (newFont) => {
    setSelectedFont(newFont);
    await AsyncStorage.setItem('selectedFont', newFont);
  };

  // Create a themeColors object based on the dark mode state
  const themeColors = {
    backgroundColor: darkMode ? '#1E1E1E' : '#F8F9FB',
    textColor: darkMode ? '#FFFFFF' : '#1B5E20',
    tabBarColor: darkMode ? '#2E2E2E' : '#FFFFFF',
    activeTabColor: '#4CAF50',
    primary: '#4CAF50',
    accent: '#81C784',
    fontFamily: selectedFont,
    gradientStart: '#4CAF50',
    gradientEnd: '#2E7D32',
    inputBackground: 'rgba(255, 255, 255, 0.1)',
    placeholderColor: darkMode ? '#BBBBBB' : '#689F38',
    secondaryTextColor: darkMode ? '#BBBBBB' : '#689F38',
    isDark: darkMode, // Set to true if darkMode is true, false otherwise
  };

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  return (
      <NavigationContainer>
        <Tab.Navigator
          tabBar={props => {
            if (props.state.routes[props.state.index].params?.tabBarVisible === false) {
              return null;
            }
            return <CustomTabBar {...props} themeColors={themeColors} />;
          }}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconSource;
              let iconStyle = {
                width: focused ? size * 1.6 : size,
                height: focused ? size * 1.4 : size,
                tintColor: focused ? themeColors.activeTabColor : 'gray',
                resizeMode: 'contain',
                marginBottom: 4,
                marginTop: 6,
                opacity: focused ? 1 : 0.7
              };

              if (route.name === 'Prayer Times') {
                iconSource = require('./assets/prayer-time.png');
              } else if (route.name === 'Quran') {
                iconSource = require('./assets/Quran-icon.png');
                iconStyle = {
                  ...iconStyle,
                  width: focused ? size * 2.5 : size * 1.8,
                  height: focused ? size * 2.5 : size * 1.8,
                  marginTop: 0,
                  marginBottom: 0
                };
              } else if (route.name === 'Tasbeeh') {
                iconSource = require('./assets/Tasbeeh.png');
              } else if (route.name === 'Qibla') {
                iconSource = require('./assets/qibla-arrow.png');
              } else if (route.name === 'Calendar') {
                iconSource = require('./assets/islamic-calendar.png');
              } else if (route.name === 'Hadith') {
                iconSource = require('./assets/Hadith-icon.png');
              } else if (route.name === 'Duas') {
                iconSource = require('./assets/Duas-icon.png'); // Make sure to add this icon
              } else if (route.name === 'Settings') {
                iconSource = require('./assets/SettingsFocused.png');
              }

              return (
                <Image
                  source={iconSource}
                  style={iconStyle}
                />
              );
            },
            tabBarActiveTintColor: themeColors.activeTabColor,
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: ({ route }) => ({
              display: 'flex',
              backgroundColor: themeColors.tabBarColor,
            }),
          })}
        >
          <Tab.Screen name="Prayer Times">
            {(props) => (
              <View style={{ flex: 1 }}>
                <PrayerTimes {...props} themeColors={themeColors} language={language} />
              </View>
            )}
          </Tab.Screen>
          <Tab.Screen name="Quran">
            {(props) => (
              <ScreenWrapper themeColors={themeColors}>
                <QuranReader {...props} themeColors={themeColors} language={language} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Tasbeeh">
            {(props) => (
              <ScreenWrapper themeColors={themeColors}>
                <TasbeehCounter {...props} themeColors={themeColors} language={language} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Duas">
            {(props) => (
              <ScreenWrapper themeColors={themeColors}>
                <DuasStackScreen {...props} themeColors={themeColors} language={language} />
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Qibla">
            {(props) => <QiblaDirection {...props} themeColors={themeColors} language={language} />}
          </Tab.Screen>
          <Tab.Screen name="Calendar">
            {(props) => (
              <ScreenWrapper themeColors={themeColors}>
                <ScrollView contentContainerStyle={styles.calendarContent}>
                  <IslamicCalendar {...props} themeColors={themeColors} language={language} />
                </ScrollView>
              </ScreenWrapper>
            )}
          </Tab.Screen>
          <Tab.Screen name="Hadith">
            {(props) => (
              <HadithOfTheDay {...props} themeColors={themeColors} language={language} />
            )}
          </Tab.Screen>
          <Tab.Screen name="Settings">
            {(props) => (
              <Settings
                {...props}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                changeTheme={changeTheme}
                themeColors={themeColors}
                selectedFont={selectedFont}
                changeFont={changeFont}
                language={language}
                changeLanguage={changeLanguage}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: height * 0.03, // Use percentage of screen height
    left: width * 0.02, // Use percentage of screen width
    right: width * 0.02,
    alignItems: 'center',
    zIndex: 1000, // Ensure the tab bar stays on top
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    height: height * 0.08, // Adjust based on screen height
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 10, // Add a small padding at the top
    paddingBottom: 100, // Adjust this value based on your navigation bar height
  },
  calendarContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increase padding for the calendar screen
  },
  hadithContent: {
    paddingBottom: 100, // Adjust padding for the Hadith screen
  },
});