import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, View, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

const Tab = createBottomTabNavigator();

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
        style
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Scheherazade');

  useEffect(() => {
    loadSettings();
    loadFonts();
  }, []);

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
      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedTheme !== null) setTheme(savedTheme);
      if (savedFont !== null) setSelectedFont(savedFont);
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
    backgroundColor: darkMode ? '#333' : '#fff',
    textColor: darkMode ? '#fff' : '#000',
    tabBarColor: darkMode ? '#222' : '#fff',
    activeTabColor: '#4CAF50', // Changed from '#2196F3' (blue) to '#4CAF50' (green)
    fontFamily: selectedFont,
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
              <PrayerTimes {...props} themeColors={themeColors} />
            </View>
          )}
        </Tab.Screen>
        <Tab.Screen name="Quran">
          {(props) => (
            <ScreenWrapper themeColors={themeColors}>
              <QuranReader {...props} themeColors={themeColors} />
            </ScreenWrapper>
          )}
        </Tab.Screen>
        <Tab.Screen name="Tasbeeh">
          {(props) => (
            <ScreenWrapper themeColors={themeColors}>
              <TasbeehCounter {...props} themeColors={themeColors} />
            </ScreenWrapper>
          )}
        </Tab.Screen>
        <Tab.Screen name="Qibla">
          {(props) => <QiblaDirection {...props} themeColors={themeColors} />}
        </Tab.Screen>
        <Tab.Screen name="Calendar">
          {(props) => (
            <ScreenWrapper themeColors={themeColors}>
              <ScrollView contentContainerStyle={styles.calendarContent}>
                <IslamicCalendar {...props} themeColors={themeColors} />
              </ScrollView>
            </ScreenWrapper>
          )}
        </Tab.Screen>
        <Tab.Screen name="Hadith">
          {(props) => (
            <HadithOfTheDay {...props} themeColors={themeColors} />
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
    left: width * 0.05, // Use percentage of screen width
    right: width * 0.05,
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