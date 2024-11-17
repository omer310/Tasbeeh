import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Image, View, TouchableOpacity, ScrollView, I18nManager, Text, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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
import DuaList from './components/DuaList';
import DuaDetails from './components/DuaDetails';
import AddCustomDua from './components/AddCustomDua';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import ErrorBoundary from './components/ErrorBoundary';
import { Audio } from 'expo-av';
import { BACKGROUND_NOTIFICATION_TASK } from './constants/NotificationConstants';

const Tab = createBottomTabNavigator();
const DuasStack = createStackNavigator();

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const adhanPreferences = await AsyncStorage.getItem('adhanPreferences');
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidImportance.MAX,
    };
  },
});

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
        component={DuaList} 
        initialParams={{ themeColors, language }} 
      />
      <DuasStack.Screen 
        name="DuaDetails" 
        component={DuaDetails} 
        initialParams={{ themeColors, language }} 
      />
      <DuasStack.Screen 
        name="AddCustomDua" 
        component={AddCustomDua} 
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

          const animatedValue = useRef(new Animated.Value(1)).current;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.reset({
                index: 0,
                routes: [{ name: route.name }],
              });
            } else if (isFocused) {
              navigation.dispatch({
                ...navigation.navigate(route.name),
                target: state.key,
              });
            }

            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]).start();
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
              <Animated.View 
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                  { transform: [{ scale: animatedValue }] }
                ]}
              >
                {options.tabBarIcon({ 
                  focused: isFocused, 
                  color: isFocused ? themeColors.activeTabColor : 'gray', 
                  size: 24 
                })}
              </Animated.View>
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
        { paddingBottom: 80 },
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

async function schedulePrayerNotifications(prayerTimes) {
  for (const [prayer, time] of Object.entries(prayerTimes)) {
    const trigger = new Date(time);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${prayer} prayer`,
        body: 'It\'s time to pray',
        sound: 'adhan.mp3',
      },
      trigger,
    });
  }
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = new Date();
  const prayerTimes = await fetchPrayerTimes(now);
  await schedulePrayerNotifications(prayerTimes);
  return BackgroundFetch.Result.NewData;
});

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

const registerForPushNotificationsAsync = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
};

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;

  const { prayer, adhanPreference } = data;
  if (!adhanPreference || adhanPreference === 'None') return;

  try {
    // For silent notifications, just show the notification without sound
    if (adhanPreference === 'Silent') {
      return;
    }

    // For default notification sound, the system will handle it
    if (adhanPreference === 'Default notification sound') {
      return;
    }

    // For custom adhans, play the sound in background
    let soundFile;
    switch (adhanPreference) {
      case 'Adhan (Nureyn Mohammad)':
        soundFile = require('./assets/adhan.mp3');
        break;
      case 'Adhan (Madina)':
        soundFile = require('./assets/madinah_adhan.mp3');
        break;
      case 'Adhan (Makka)':
        soundFile = require('./assets/makkah_adhan.mp3');
        break;
      case 'Long beep':
        soundFile = require('./assets/long_beep.mp3');
        break;
      default:
        return;
    }

    const { sound } = await Audio.Sound.createAsync(soundFile, {
      shouldPlay: true,
      isLooping: false,
      volume: 1.0,
      staysActiveInBackground: true,
    });

    // Keep track of the sound object globally
    global.currentAdhanSound = sound;

    // Clean up after playback
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await sound.unloadAsync();
        delete global.currentAdhanSound;
      }
    });
  } catch (error) {
    console.error("Error playing adhan:", error);
  }
});

// Configure audio for background playback
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
});

const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Scheherazade');
  const [language, setLanguage] = useState('en');
  const [playAdhan, setPlayAdhan] = useState(true);
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
    loadFonts();
    setupLanguage();
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    registerBackgroundFetchAsync();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const setupLanguage = async () => {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
      // Remove the line that forces RTL
      // I18nManager.forceRTL(savedLanguage === 'ar');
    }
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    // Remove the line that forces RTL
    // I18nManager.forceRTL(newLanguage === 'ar');
    console.log('Language changed to:', newLanguage);
  };

  const loadFonts = async () => {
    await Font.loadAsync({
      ...Ionicons.font,
      'Scheherazade': require('./assets/fonts/Scheherazade-Regular.ttf'),
      'Amiri': require('./assets/fonts/Amiri-Regular.ttf'),
      'Lateef': require('./assets/fonts/Lateef-Regular.ttf'),
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

  // Update themeColors based on darkMode
  const themeColors = {
    backgroundColor: darkMode ? '#1E1E1E' : '#FFFFFF',
    textColor: darkMode ? '#FFFFFF' : '#000000',
    tabBarColor: darkMode ? '#2E2E2E' : '#FFFFFF',
    activeTabColor: '#4CAF50',
    primary: '#4CAF50',
    accent: '#81C784',
    fontFamily: selectedFont,
    gradientStart: '#4CAF50',
    gradientEnd: '#2E7D32',
    inputBackground: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    placeholderColor: darkMode ? '#BBBBBB' : '#689F38',
    secondaryTextColor: darkMode ? '#BBBBBB' : '#689F38',
    isDark: darkMode,
    separatorColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    darkTextColor: '#FFFFFF',
    darkSecondaryTextColor: '#BBBBBB',
  };

  if (!fontsLoaded) {
    return null;
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
              iconSource = require('./assets/Duas-icon.png');
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
          tabBarStyle: {
            display: 'none',
          },
        })}
      >
        <Tab.Screen name="Prayer Times">
          {(props) => (
            <View style={{ flex: 1 }}>
              <PrayerTimes 
                {...props} 
                themeColors={themeColors} 
                language={language}
                registerForPushNotificationsAsync={registerForPushNotificationsAsync}
                isDarkMode={darkMode}
              />
            </View>
          )}
        </Tab.Screen>
        <Tab.Screen name="Quran">
          {(props) => (
            <ScreenWrapper themeColors={themeColors}>
              <ErrorBoundary>
                <QuranReader {...props} themeColors={themeColors} language={language} />
              </ErrorBoundary>
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
          {(props) => <QiblaDirection isDarkMode={isDarkMode} language={language} />}
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
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: -20 ,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 100,
  },
  calendarContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  hadithContent: {
    paddingBottom: 100,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 25,
    height: 45,
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 25,
    padding: 8,
  },
});