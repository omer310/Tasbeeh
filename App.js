import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Image, View, TouchableOpacity, ScrollView, I18nManager, Text, Animated, useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import * as Notifications from 'expo-notifications';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import SplashScreen from './components/SplashScreen';
import MyDuas from './components/MyDuas';
import { DuaProvider } from './contexts/DuaContext';

const Tab = createBottomTabNavigator();
const DuasStack = createStackNavigator();
const Stack = createStackNavigator();

import { initializeNotifications, requestNotificationPermissions } from './services/NotificationService';
import { configureAudio } from './services/AudioService';

const DUA_SCREENS = { DuasHome: Duas, DuaList, MyDuas, DuaDetails, AddCustomDua };
function DuasStackScreen({ themeColors, language }) {
  return <DuasStack.Navigator screenOptions={{ headerShown: false }}>
    {Object.entries(DUA_SCREENS).map(([name, Component]) => <DuasStack.Screen key={name} name={name}>
      {props => <Component {...props} themeColors={themeColors} language={language} isDarkMode={themeColors.isDark}
        route={{ ...props.route, params: { ...props.route.params, themeColors, language, isDarkMode: themeColors.isDark } }} />}
    </DuasStack.Screen>)}
  </DuasStack.Navigator>;
}

function TabBarButton({ route, options, isFocused, navigation, themeColors }) {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    Animated.sequence([
      Animated.timing(animatedValue, { toValue: 0.8, duration: 100, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(animatedValue, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={route.name}
      accessibilityState={{ selected: isFocused }} onPress={onPress} style={styles.tabItem}>
      <Animated.View style={[styles.iconContainer, isFocused && styles.activeIconContainer,
        { transform: [{ scale: animatedValue }] }]}>
        {options.tabBarIcon({ focused: isFocused, color: isFocused ? themeColors.activeTabColor : 'gray', size: 24 })}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation, themeColors }) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { backgroundColor: themeColors.tabBarColor }]}>
        {state.routes.map((route, index) => (
          <TabBarButton key={route.key} route={route} options={descriptors[route.key].options}
            isFocused={state.index === index} navigation={navigation} themeColors={themeColors} />
        ))}
      </View>
    </View>
  );
}

function ScreenWrapper({ children, style, themeColors }) {
  const isDarkMode = themeColors.isDark;
  
  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        { backgroundColor: themeColors.backgroundColor },
        { paddingBottom: 80 },
        style
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      {children}
    </SafeAreaView>
  );
}

function MainAppContent({ 
  themeColors, 
  language, 
  darkMode, 
  toggleDarkMode, 
  theme, 
  changeTheme, 
  selectedFont, 
  changeFont, 
  changeLanguage 
}) {
  return (
    <>
      <AppStatusBar darkMode={darkMode} />
      <Tab.Navigator
        tabBar={props => (
          <CustomTabBar {...props} themeColors={themeColors} />
        )}
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
                registerForPushNotificationsAsync={requestNotificationPermissions}
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
          {(props) => <QiblaDirection themeColors={themeColors} isDarkMode={darkMode} language={language} />}
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
    </>
  );
}

const AppStatusBar = ({ darkMode }) => (
  <StatusBar 
    barStyle={darkMode ? 'light-content' : 'dark-content'}
    backgroundColor={darkMode ? '#1E1E1E' : '#FFFFFF'}
    translucent={true}
  />
);

function AppContent() {
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load all necessary settings
        await loadSettings();
        await loadFonts();
        await setupLanguage();
        configureAudio().catch(error => console.warn('Audio setup:', error));
        
        // Check onboarding status
        const status = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(status === 'true');

        if (Platform.OS !== 'web') {
        // Setup notifications
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
        });

        }
        initializeNotifications().catch(error => console.warn('Notification setup:', error));
        
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 1200);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const setupLanguage = async () => {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
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
    primaryColor: '#4CAF50',
    cardColor: darkMode ? '#28312F' : '#FFFFFF',
    accent: '#81C784',
    errorColor: darkMode ? '#ff8a80' : '#b71c1c',
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

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!fontsLoaded || isLoading) {
    return <SplashScreen isDarkMode={darkMode} />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding 
      onComplete={handleOnboardingComplete} 
      changeLanguage={changeLanguage}
    />;
  }

  return (
    <DuaProvider>
      <NavigationContainer theme={{ ...(darkMode ? DarkTheme : DefaultTheme), colors: { ...(darkMode ? DarkTheme : DefaultTheme).colors, background: themeColors.backgroundColor, card: themeColors.cardColor, text: themeColors.textColor, primary: themeColors.primary } }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainApp">
            {() => (
              <MainAppContent 
                themeColors={themeColors}
                language={language}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                theme={theme}
                changeTheme={changeTheme}
                selectedFont={selectedFont}
                changeFont={changeFont}
                changeLanguage={changeLanguage}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </DuaProvider>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider><ErrorBoundary><AppContent /></ErrorBoundary></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
