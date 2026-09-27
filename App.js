import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated, useColorScheme, Platform, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme, useIsFocused, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import SplashScreen from './components/SplashScreen';
import MyDuas from './components/MyDuas';
import TabIcon from './components/TabIcon';
import { DuaProvider } from './contexts/DuaContext';
import { initializeNotifications, requestNotificationPermissions } from './services/NotificationService';
import { configureAudio } from './services/AudioService';
import { withTimeout } from './utils/withTimeout';
import useHomeWidgets from './hooks/useHomeWidgets';


const Tab = createBottomTabNavigator();
const DuasStack = createStackNavigator();
const Stack = createStackNavigator();
const WARM_TABS = ['Quran', 'Tasbeeh', 'Duas', 'Settings', 'Calendar', 'Hadith', 'Qibla'];

// Preloaded screens otherwise keep receiving global language/theme renders:
// react-navigation deliberately does not freeze routes still marked preloaded.
const RetainedContent = React.memo(function RetainedContent({ children }) { return children; }, (_, next) => !next.active);
function FocusedContent({ children }) {
  return <RetainedContent active={useIsFocused()}>{children}</RetainedContent>;
}

function TabWarmup({ navigation, enabled }) {
  useEffect(() => {
    if (!enabled) return;
    let index = 0, cancelled = false, idle;
    const prepareNext = () => {
      idle = requestIdleCallback(() => {
        if (cancelled) return;
        startTransition(() => navigation.preload(WARM_TABS[index++]));
        if (index < WARM_TABS.length) prepareNext();
      });
    };
    prepareNext();
    return () => { cancelled = true; cancelIdleCallback(idle); };
  }, [enabled, navigation]);
  return null;
}

function HomeSplash({ ready, darkMode }) {
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!ready) return;
    const animation = Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => { if (finished) setVisible(false); });
    return () => animation.stop();
  }, [ready, opacity]);
  return visible ? <Animated.View accessibilityViewIsModal style={[StyleSheet.absoluteFill, { opacity, zIndex: 10, elevation: 10 }]}><SplashScreen isDarkMode={darkMode} /></Animated.View> : null;
}


const DUA_SCREENS = { DuasHome: Duas, DuaList, MyDuas, DuaDetails, AddCustomDua };
function DuasStackScreen({ themeColors, language }) {
  return <DuasStack.Navigator screenOptions={{ headerShown: false }}>
    {Object.entries(DUA_SCREENS).map(([name, Component]) => <DuasStack.Screen key={name} name={name}>
      {props => <Component key={`${props.route.params?.category?.id || ''}:${props.route.params?.widgetOpenId || ''}`} {...props} themeColors={themeColors} language={language} isDarkMode={themeColors.isDark}
        route={{ ...props.route, params: { ...props.route.params, themeColors, language, isDarkMode: themeColors.isDark } }} />}
    </DuasStack.Screen>)}
  </DuasStack.Navigator>;
}

function TabBarButton({ route, options, isFocused, navigation, themeColors }) {
  const [animatedValue] = useState(() => new Animated.Value(1));
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

function CustomTabBar({ state, descriptors, navigation, themeColors, homeReady }) {
  return (
    <View style={styles.tabBarContainer}>
      <TabWarmup navigation={navigation} enabled={homeReady} />
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
    <FocusedContent><SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.safeArea, 
        { backgroundColor: themeColors.backgroundColor },
        { paddingBottom: 96 },
        style
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      {children}
    </SafeAreaView></FocusedContent>
  );
}

function MainAppContent({ 
  themeColors, 
  language, 
  darkMode, 
  toggleDarkMode, 
  appearanceMode,
  changeAppearance,
  theme, 
  changeTheme, 
  selectedFont, 
  changeFont, 
  changeLanguage,
  homeReady,
  onHomeReady,
}) {
  return (
    <>
      <AppStatusBar darkMode={darkMode} />
      <Tab.Navigator
        tabBar={props => (
          <CustomTabBar {...props} themeColors={themeColors} homeReady={homeReady} />
        )}
        screenOptions={({ route }) => ({
          headerShown: false,
          freezeOnBlur: true,
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} color={focused ? themeColors.activeTabColor : themeColors.secondaryTextColor} />,
          tabBarActiveTintColor: themeColors.activeTabColor,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            display: 'none',
          },
        })}
      >
        <Tab.Screen name="Prayer Times">
          {(props) => (
            <FocusedContent><View style={{ flex: 1 }}>
              <PrayerTimes 
                {...props} 
                themeColors={themeColors} 
                language={language}
                registerForPushNotificationsAsync={requestNotificationPermissions}
                isDarkMode={darkMode}
                onInitialReady={onHomeReady}
              />
            </View></FocusedContent>
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
          {(props) => <FocusedContent><QiblaDirection themeColors={themeColors} isDarkMode={darkMode} language={language} /></FocusedContent>}
        </Tab.Screen>
        <Tab.Screen name="Calendar">
          {(props) => (
            <ScreenWrapper themeColors={themeColors}>
              <IslamicCalendar {...props} themeColors={themeColors} language={language} />
            </ScreenWrapper>
          )}
        </Tab.Screen>
        <Tab.Screen name="Hadith">
          {(props) => (
            <FocusedContent><HadithOfTheDay {...props} themeColors={themeColors} language={language} /></FocusedContent>
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {(props) => (
            <FocusedContent><Settings
              {...props}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              appearanceMode={appearanceMode}
              changeAppearance={changeAppearance}
              theme={theme}
              changeTheme={changeTheme}
              themeColors={themeColors}
              selectedFont={selectedFont}
              changeFont={changeFont}
              language={language}
              changeLanguage={changeLanguage}
            /></FocusedContent>
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
  const systemScheme = useColorScheme();
  const [appearanceMode, setAppearanceMode] = useState('system');
  const darkMode = appearanceMode === 'system' ? systemScheme === 'dark' : appearanceMode === 'dark';
  const [theme, setTheme] = useState('default');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Scheherazade');
  const [language, setLanguage] = useState('en');
  const [homeReady, setHomeReady] = useState(false);
  const onHomeReady = useCallback(() => setHomeReady(true), []);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState(null);
  const [startupAttempt, setStartupAttempt] = useState(0);
  const navigationRef = useNavigationContainerRef();
  const onWidgetNavigationReady = useHomeWidgets(navigationRef, onHomeReady, language, appearanceMode, fontsLoaded && !isLoading);

  useEffect(() => {
    let active = true;
    const initializeApp = async () => {
      setStartupError(null); setIsLoading(true);
      try {
        const [entries] = await Promise.all([
          withTimeout(AsyncStorage.multiGet(['appearanceMode', 'theme', 'selectedFont', 'language', 'hasCompletedOnboarding']), 15000, 'App settings could not be loaded.'),
          loadFonts(),
        ]);
        if (!active) return;
        const saved = Object.fromEntries(entries);
        if (['system', 'light', 'dark'].includes(saved.appearanceMode)) setAppearanceMode(saved.appearanceMode);
        if (saved.theme) setTheme(saved.theme);
        if (saved.selectedFont) setSelectedFont(saved.selectedFont);
        if (saved.language) setLanguage(saved.language);
        setHasCompletedOnboarding(saved.hasCompletedOnboarding === 'true');
        setFontsLoaded(true);
        configureAudio().catch(error => console.warn('Audio setup:', error));
        initializeNotifications().catch(error => console.warn('Notification setup:', error));
        setIsLoading(false);
      } catch (error) {
        if (!active) return;
        console.error('Error initializing app:', error);
        setStartupError('Could not load the app’s settings or fonts. Please retry.');
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => { active = false; };
  }, [startupAttempt]);

  const languageWrites = useRef(Promise.resolve());
  const changeLanguage = useCallback(newLanguage => {
    if (!['en', 'ar'].includes(newLanguage)) return Promise.resolve();
    // The selection sheet has its own immediate feedback. Updating the wider
    // navigation tree is interruptible, and storage cannot reorder rapid picks.
    startTransition(() => setLanguage(newLanguage));
    languageWrites.current = languageWrites.current.catch(() => {}).then(() => AsyncStorage.setItem('language', newLanguage));
    return languageWrites.current;
  }, []);

  async function loadFonts() {
    await withTimeout(Font.loadAsync({
      ...Ionicons.font,
      ...Feather.font,
      ...MaterialIcons.font,
      ...MaterialCommunityIcons.font,
      'Scheherazade': require('./assets/fonts/Scheherazade-Regular.ttf'),
      'Amiri': require('./assets/fonts/Amiri-Regular.ttf'),
      'QuranDuri': require('./assets/fonts/QuranDuri.ttf'),
      'Lateef': require('./assets/fonts/Lateef-Regular.ttf'),
    }), 15000, 'App fonts could not be loaded.');
  };

  const changeAppearance = async mode => {
    if (!['system', 'light', 'dark'].includes(mode)) return;
    setAppearanceMode(mode);
    await AsyncStorage.setItem('appearanceMode', mode);
  };
  const toggleDarkMode = () => changeAppearance(darkMode ? 'light' : 'dark');

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const changeFont = async (newFont) => {
    setSelectedFont(newFont);
    await AsyncStorage.setItem('selectedFont', newFont);
  };

  // Update themeColors based on darkMode
  const themeColors = useMemo(() => ({
    backgroundColor: darkMode ? '#17231D' : '#FAFBF8',
    textColor: darkMode ? '#EFF5EF' : '#19382B',
    tabBarColor: darkMode ? '#2E2E2E' : '#FFFFFF',
    activeTabColor: darkMode ? '#86C9A4' : '#287457',
    primary: '#287457',
    primaryColor: darkMode ? '#86C9A4' : '#287457',
    cardColor: darkMode ? '#28312F' : '#FFFFFF',
    accent: '#81C784',
    errorColor: darkMode ? '#ff8a80' : '#b71c1c',
    fontFamily: selectedFont,
    gradientStart: '#4CAF50',
    gradientEnd: '#2E7D32',
    inputBackground: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    placeholderColor: darkMode ? '#BBBBBB' : '#689F38',
    secondaryTextColor: darkMode ? '#ACBBB0' : '#66796C',
    isDark: darkMode,
    separatorColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    darkTextColor: '#FFFFFF',
    darkSecondaryTextColor: '#BBBBBB',
  }), [darkMode, selectedFont]);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (startupError) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: themeColors.backgroundColor }}>
      <Text style={{ color: themeColors.textColor, textAlign: 'center', marginBottom: 20 }}>{startupError}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setStartupAttempt(value => value + 1)} style={{ padding: 16, alignItems: 'center' }}><Text style={{ color: themeColors.activeTabColor }}>Retry loading app</Text></TouchableOpacity>
    </SafeAreaView>;
  }
  if (!fontsLoaded || isLoading) {
    return <SplashScreen isDarkMode={darkMode} />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding 
      onComplete={handleOnboardingComplete} 
      changeLanguage={changeLanguage}
      themeColors={themeColors}
      language={language}
    />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.backgroundColor }}>
    <View style={{ flex: 1 }} accessibilityElementsHidden={!homeReady} importantForAccessibility={homeReady ? 'auto' : 'no-hide-descendants'} pointerEvents={homeReady ? 'auto' : 'none'}>
    <DuaProvider>
      <NavigationContainer ref={navigationRef} onReady={onWidgetNavigationReady} theme={{ ...(darkMode ? DarkTheme : DefaultTheme), colors: { ...(darkMode ? DarkTheme : DefaultTheme).colors, background: themeColors.backgroundColor, card: themeColors.cardColor, text: themeColors.textColor, primary: themeColors.primary } }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainApp">
            {() => (
              <MainAppContent 
                themeColors={themeColors}
                language={language}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                appearanceMode={appearanceMode}
                changeAppearance={changeAppearance}
                theme={theme}
                changeTheme={changeTheme}
                selectedFont={selectedFont}
                changeFont={changeFont}
                changeLanguage={changeLanguage}
                homeReady={homeReady}
                onHomeReady={onHomeReady}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </DuaProvider>
    </View>
    <HomeSplash ready={homeReady} darkMode={darkMode} />
    </View>
  );
}


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
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 100,
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
